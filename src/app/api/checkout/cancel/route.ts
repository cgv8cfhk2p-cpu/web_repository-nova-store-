import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { cancelOrderAndReleaseStock } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// El cliente vuelve de Stripe sin pagar: caducamos la sesión y liberamos el stock reservado.
export async function POST(req: Request) {
  const rl = rateLimit(`cancel:${clientIp(req.headers)}`, 20, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  const parsed = z.object({ orderId: z.string().min(10).max(40) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.status !== "PENDING") return NextResponse.json({ ok: true });

  if (order.stripeSessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
      if (session.status === "complete") return NextResponse.json({ ok: true }); // ya pagado: lo confirmará el webhook
      if (session.status === "open") await getStripe().checkout.sessions.expire(order.stripeSessionId);
    } catch (e) {
      console.warn("[cancel] No se pudo caducar la sesión", (e as Error).message);
      return NextResponse.json({ ok: false });
    }
  }
  await cancelOrderAndReleaseStock(order.id, "El cliente canceló el pago y volvió a la tienda.");
  return NextResponse.json({ ok: true });
}
