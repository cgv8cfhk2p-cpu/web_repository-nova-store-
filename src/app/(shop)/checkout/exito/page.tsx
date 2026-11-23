import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { countryName } from "@/lib/countries";
import { ClearCart, AutoRefresh } from "@/components/shop/SuccessClient";

export const metadata: Metadata = { title: "Pedido recibido", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const order =
    session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id)
      ? await prisma.order.findUnique({ where: { stripeSessionId: session_id }, include: { items: true } })
      : null;

  if (!order) {
    return (
      <div className="container-ns flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-3xl font-light">No encontramos este pedido</h1>
        <p className="mt-3 text-ink-500">Si has completado el pago, recibirás la confirmación por correo de Stripe.</p>
        <Link href="/" className="btn-primary mt-8">Volver al inicio</Link>
      </div>
    );
  }

  // El pedido solo se muestra como confirmado cuando el webhook de Stripe lo ha marcado como pagado
  const confirmed = order.status !== "PENDING" && order.status !== "CANCELLED";

  return (
    <div className="container-ns max-w-3xl py-12 sm:py-20">
      <ClearCart />
      {!confirmed && <AutoRefresh />}
      <div className="text-center">
        {confirmed ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-ink-900 animate-fade-in" strokeWidth={1.2} />
        ) : (
          <Clock className="mx-auto h-14 w-14 animate-pulse text-ink-400" strokeWidth={1.2} />
        )}
        <p className="eyebrow mt-6">Pedido #{order.number}</p>
        <h1 className="mt-2 text-4xl font-light tracking-tight">
          {confirmed ? "¡Gracias por tu compra!" : "Estamos confirmando tu pago…"}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-500">
          {confirmed
            ? `Hemos recibido tu pago. Te enviaremos el número de seguimiento a ${order.email} cuando el pedido salga de nuestro almacén.`
            : "Stripe está verificando el pago. Esta página se actualizará automáticamente en unos segundos."}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">Envío a</h2>
          <address className="text-sm not-italic leading-relaxed text-ink-600">
            {order.shippingName}<br />
            {order.shippingAddress1}{order.shippingAddress2 ? `, ${order.shippingAddress2}` : ""}<br />
            {order.shippingPostalCode} {order.shippingCity} ({order.shippingProvince})<br />
            {countryName(order.shippingCountry)}
          </address>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">Resumen</h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3"><span className="truncate">{i.quantity} × {i.name}</span><span className="tabular-nums">{formatPrice(i.unitPriceCents * i.quantity)}</span></li>
            ))}
            <li className="flex justify-between border-t border-ink-100 pt-2 text-ink-500"><span>Envío</span><span className="tabular-nums">{order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}</span></li>
            <li className="flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">{formatPrice(order.totalCents)}</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 text-center">
        <Link href="/tienda" className="btn-primary">Seguir comprando</Link>
      </div>
    </div>
  );
}
