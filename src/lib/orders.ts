import "server-only";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { Quote } from "./pricing";
import type { ShippingInput } from "./validation";

export class OutOfStockError extends Error {}

/**
 * Crea el pedido en estado PENDIENTE y reserva el stock de forma atómica.
 * Si cualquier producto no tiene stock suficiente, no se crea nada.
 */
export async function createPendingOrder(quote: Quote, shipping: ShippingInput, clientIp: string) {
  if (!quote.shipping) throw new Error("No hay tarifa de envío para el país seleccionado.");

  return prisma.$transaction(async (tx) => {
    for (const line of quote.lines) {
      const res = await tx.product.updateMany({
        where: { id: line.productId, active: true, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count !== 1) throw new OutOfStockError(`No hay stock suficiente de «${line.name}».`);
    }

    const customer = await tx.customer.upsert({
      where: { email: shipping.email },
      update: { fullName: shipping.fullName, phone: shipping.phone },
      create: { email: shipping.email, fullName: shipping.fullName, phone: shipping.phone },
    });

    return tx.order.create({
      data: {
        status: "PENDING",
        customerId: customer.id,
        email: shipping.email,
        shippingName: shipping.fullName,
        shippingPhone: shipping.phone,
        shippingCountry: shipping.country,
        shippingProvince: shipping.province,
        shippingCity: shipping.city,
        shippingPostalCode: shipping.postalCode.toUpperCase(),
        shippingAddress1: shipping.address1,
        shippingAddress2: shipping.address2 || null,
        subtotalCents: quote.subtotalCents,
        shippingCents: quote.shipping!.priceCents,
        totalCents: quote.totalCents,
        shippingRateName: quote.shipping!.name,
        clientIp,
        items: {
          create: quote.lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            sku: l.sku,
            imageUrl: l.imageUrl,
            unitPriceCents: l.unitPriceCents,
            quantity: l.quantity,
          })),
        },
        events: { create: { type: "created", message: "Pedido creado. Esperando pago en Stripe." } },
      },
      include: { items: true },
    });
  });
}

/** Devuelve el stock reservado de un pedido no pagado (una sola vez). */
export async function cancelOrderAndReleaseStock(orderId: string, reason: string, tx?: Prisma.TransactionClient) {
  const run = async (db: Prisma.TransactionClient) => {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== "PENDING") return false;
    // Marca atómica para que dos webhooks simultáneos no devuelvan el stock dos veces
    const claimed = await db.order.updateMany({
      where: { id: orderId, status: "PENDING", stockReleased: false },
      data: { status: "CANCELLED", stockReleased: true },
    });
    if (claimed.count !== 1) return false;
    for (const item of order.items) {
      if (item.productId) {
        await db.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
    await db.orderEvent.create({ data: { orderId, type: "cancelled", message: reason } });
    return true;
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

/**
 * Confirma el pago. Solo se llama desde el webhook, tras verificar la firma de Stripe
 * y que el importe y la moneda coinciden con el pedido.
 */
export async function markOrderPaid(session: Stripe.Checkout.Session, riskLevel: string | null) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) throw new Error(`Sesión ${session.id} sin orderId`);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error(`Pedido ${orderId} no encontrado`);
  if (order.stripeSessionId && order.stripeSessionId !== session.id) {
    throw new Error(`La sesión ${session.id} no corresponde al pedido ${orderId}`);
  }
  if (order.status !== "PENDING" && order.status !== "CANCELLED") return { order, changed: false };

  if (session.amount_total !== order.totalCents || session.currency !== order.currency) {
    await prisma.orderEvent.create({
      data: {
        orderId,
        type: "amount_mismatch",
        message: `ALERTA: Stripe cobró ${session.amount_total} ${session.currency} pero el pedido es de ${order.totalCents} ${order.currency}. Revisar manualmente.`,
      },
    });
    throw new Error(`Importe no coincide para el pedido ${orderId}`);
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  return prisma.$transaction(async (tx) => {
    // Caso raro: la sesión caducó (stock devuelto) pero el pago llegó después (pago asíncrono).
    // Volvemos a descontar el stock y dejamos aviso para revisar.
    if (order.status === "CANCELLED" && order.stockReleased) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const it of items) {
        if (it.productId) {
          await tx.product.updateMany({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
        }
      }
      await tx.orderEvent.create({
        data: { orderId, type: "warning", message: "Pago recibido tras cancelación: stock descontado de nuevo. Revisa las existencias." },
      });
    }
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stockReleased: false,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeRiskLevel: riskLevel,
        events: {
          create: {
            type: "paid",
            message: `Pago confirmado por Stripe (${paymentIntentId ?? session.id}).${riskLevel && riskLevel !== "normal" ? ` Riesgo Radar: ${riskLevel}.` : ""}`,
          },
        },
      },
    });
    return { order: updated, changed: true };
  });
}

export async function markOrderRefunded(paymentIntentId: string, fully: boolean, amountRefunded: number) {
  const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
  if (!order) return null;
  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: fully ? "REFUNDED" : order.status,
      events: {
        create: {
          type: "refund",
          message: `${fully ? "Reembolso total" : "Reembolso parcial"} en Stripe: ${(amountRefunded / 100).toFixed(2)} €`,
        },
      },
    },
  });
}

/** Limpia pedidos pendientes abandonados (por si un webhook de expiración no llega). */
export async function expireStalePendingOrders(olderThanMinutes = 90) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const stale = await prisma.order.findMany({
    // Se excluyen los pedidos con un pago asíncrono en proceso (p. ej. transferencia/SEPA)
    where: { status: "PENDING", createdAt: { lt: cutoff }, events: { none: { type: "payment_processing" } } },
    select: { id: true },
    take: 100,
  });
  for (const o of stale) await cancelOrderAndReleaseStock(o.id, "Pedido caducado sin pago.");
  return stale.length;
}
