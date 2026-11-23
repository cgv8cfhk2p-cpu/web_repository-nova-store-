import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { cancelOrderAndReleaseStock, markOrderPaid, markOrderRefunded } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Stripe. ÚNICO punto donde un pedido pasa a "Pagado".
 * Eventos a activar en el Dashboard de Stripe:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Falta la firma" }, { status: 400 });

  const payload = await req.text(); // cuerpo sin procesar: necesario para verificar la firma
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.warn("[webhook] Firma no válida", (err as Error).message);
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  // Idempotencia: Stripe puede reenviar el mismo evento varias veces
  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          const risk = await getRiskLevel(stripe, session);
          await markOrderPaid(session, risk);
        } else {
          // Pago asíncrono en curso (p. ej. SEPA): se confirmará con async_payment_succeeded
          const orderId = session.metadata?.orderId;
          if (orderId) {
            await prisma.orderEvent.create({
              data: { orderId, type: "payment_processing", message: "Pago en proceso. Esperando confirmación de Stripe." },
            });
          }
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await cancelOrderAndReleaseStock(
            orderId,
            event.type === "checkout.session.expired" ? "La sesión de pago caducó sin completarse." : "El pago ha fallado.",
          );
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi) await markOrderRefunded(pi, charge.refunded, charge.amount_refunded);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[webhook] Error procesando ${event.type} ${event.id}:`, msg);
    if (msg.startsWith("Importe no coincide")) {
      // Ya queda registrado en el historial del pedido para revisión manual; no reintentar
      await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } }).catch(() => {});
      return NextResponse.json({ received: true, flagged: true });
    }
    // 500 => Stripe reintentará automáticamente
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } }).catch(() => {});
  return NextResponse.json({ received: true });
}

/** Nivel de riesgo de Stripe Radar (normal / elevated / highest) para avisar en el panel. */
async function getRiskLevel(stripe: Stripe, session: Stripe.Checkout.Session): Promise<string | null> {
  try {
    const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!piId) return null;
    const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    const charge = pi.latest_charge as Stripe.Charge | null;
    return charge?.outcome?.risk_level ?? null;
  } catch {
    return null;
  }
}
