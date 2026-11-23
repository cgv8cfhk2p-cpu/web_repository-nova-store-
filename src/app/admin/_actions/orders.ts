"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Carrier, OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelOrderAndReleaseStock } from "@/lib/orders";
import { CARRIER_LABELS, MANUAL_TRANSITIONS, STATUS_LABELS } from "@/lib/order-status";
import { buildTrackingUrl, getCarrier } from "@/lib/carriers";
import type { ActionState } from "@/components/admin/ActionForm";

const id = z.string().min(5).max(40);

export async function updateOrderStatus(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ orderId: id, status: z.enum(["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]) })
    .safeParse({ orderId: fd.get("orderId"), status: fd.get("status") });
  if (!parsed.success) return { error: "Datos no válidos." };
  const { orderId, status } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Pedido no encontrado." };
  if (order.status === status) return { ok: "Sin cambios." };
  if (!MANUAL_TRANSITIONS[order.status].includes(status as OrderStatus)) {
    return { error: `No se puede pasar de «${STATUS_LABELS[order.status]}» a «${STATUS_LABELS[status]}». El estado «Pagado» solo lo confirma Stripe.` };
  }

  if (status === "CANCELLED") {
    await cancelOrderAndReleaseStock(orderId, `Cancelado manualmente por ${admin.email}.`);
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        shippedAt: status === "SHIPPED" ? order.shippedAt ?? new Date() : order.shippedAt,
        deliveredAt: status === "DELIVERED" ? new Date() : status === "SHIPPED" ? null : order.deliveredAt,
        events: { create: { type: "status", message: `Estado: ${STATUS_LABELS[order.status]} → ${STATUS_LABELS[status]} (${admin.email})` } },
      },
    });
  }
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  return { ok: `Estado actualizado a «${STATUS_LABELS[status]}».`, ts: Date.now() };
}

export async function updateShipment(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      orderId: id,
      carrier: z.enum(["NONE", "CORREOS", "GLS", "DHL", "OTHER"]),
      trackingNumber: z.string().trim().max(60).regex(/^[A-Za-z0-9 -]*$/, "Número de seguimiento no válido"),
      trackingUrl: z.string().trim().max(300).url("URL no válida").or(z.literal("")),
      markShipped: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  const { orderId, carrier, trackingNumber, trackingUrl, markShipped } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Pedido no encontrado." };
  const ship = markShipped === "1" && ["PAID", "PREPARING"].includes(order.status);
  if (markShipped === "1" && !ship) return { error: "Solo se pueden enviar pedidos pagados o en preparación." };
  if (ship && !trackingNumber) return { error: "Introduce el número de seguimiento para marcarlo como enviado." };

  const url = trackingUrl || buildTrackingUrl(carrier as Carrier, trackingNumber) || null;
  await prisma.order.update({
    where: { id: orderId },
    data: {
      carrier: carrier as Carrier,
      trackingNumber: trackingNumber || null,
      trackingUrl: url,
      ...(ship ? { status: "SHIPPED" as const, shippedAt: new Date() } : {}),
      events: {
        create: {
          type: "shipment",
          message: `${ship ? "Enviado. " : ""}Transportista: ${CARRIER_LABELS[carrier as Carrier]}${trackingNumber ? ` · Seguimiento: ${trackingNumber}` : ""} (${admin.email})`,
        },
      },
    },
  });
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: ship ? "Pedido marcado como enviado." : "Datos de envío guardados.", ts: Date.now() };
}

export async function saveOrderNotes(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.object({ orderId: id, adminNotes: z.string().max(2000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Datos no válidos." };
  await prisma.order.update({ where: { id: parsed.data.orderId }, data: { adminNotes: parsed.data.adminNotes || null } });
  revalidatePath(`/admin/pedidos/${parsed.data.orderId}`);
  return { ok: "Notas guardadas.", ts: Date.now() };
}

/** Generación automática de etiqueta (preparado para Correos, GLS y DHL). */
export async function generateLabel(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const orderId = String(fd.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Pedido no encontrado." };
  const provider = getCarrier(order.carrier);
  if (!provider) return { error: "Selecciona primero Correos, GLS o DHL como transportista y guarda." };
  if (!["PAID", "PREPARING"].includes(order.status)) return { error: "Solo se generan etiquetas de pedidos pagados." };
  try {
    const label = await provider.createLabel(order);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: label.trackingNumber,
        trackingUrl: label.trackingUrl ?? provider.trackingUrl(label.trackingNumber),
        labelUrl: label.labelUrl ?? null,
        events: { create: { type: "label", message: `Etiqueta generada con ${provider.name}: ${label.trackingNumber}` } },
      },
    });
    revalidatePath(`/admin/pedidos/${orderId}`);
    return { ok: "Etiqueta generada." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
