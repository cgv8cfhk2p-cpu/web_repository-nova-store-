import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { countryName } from "@/lib/countries";
import { CARRIER_LABELS, MANUAL_TRANSITIONS, STATUS_LABELS } from "@/lib/order-status";
import { carriers } from "@/lib/carriers";
import { isTestMode } from "@/lib/stripe";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { CopyButton } from "@/components/admin/CopyButton";
import { generateLabel, saveOrderNotes, updateOrderStatus, updateShipment } from "@/app/admin/_actions/orders";

export const metadata = { title: "Pedido" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, stock: true } } } },
      events: { orderBy: { createdAt: "desc" } },
      customer: { include: { _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();

  const transitions = MANUAL_TRANSITIONS[order.status];
  const addressText = [
    order.shippingName,
    order.shippingAddress1,
    order.shippingAddress2,
    `${order.shippingPostalCode} ${order.shippingCity}`,
    order.shippingProvince,
    countryName(order.shippingCountry),
    `Tel. ${order.shippingPhone}`,
  ].filter(Boolean).join("\n");
  const stripeBase = `https://dashboard.stripe.com${isTestMode() ? "/test" : ""}`;
  const canShip = ["PAID", "PREPARING"].includes(order.status);

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Pedidos</Link>
      <PageHeader
        title={`Pedido #${order.number}`}
        description={`${order.createdAt.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}${order.paidAt ? ` · Pagado el ${order.paidAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}` : ""}`}
        actions={<StatusBadge status={order.status} />}
      />

      {order.stripeRiskLevel && order.stripeRiskLevel !== "normal" && (
        <div className="mb-6 flex gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div><strong>Stripe Radar ha marcado este pago con riesgo «{order.stripeRiskLevel}».</strong> Revisa el pago en Stripe antes de enviar. Si sospechas fraude, reembolsa desde Stripe en lugar de enviar el pedido.</div>
        </div>
      )}
      {order.status === "PENDING" && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Este pedido <strong>no está pagado</strong>. No lo envíes: pasará a «Pagado» automáticamente cuando Stripe confirme el cobro, o se cancelará si caduca.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Artículos">
            <ul className="divide-y divide-ink-100">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {i.imageUrl ? <img src={i.imageUrl} alt="" className="h-14 w-12 rounded-lg bg-ink-100 object-cover" /> : <div className="h-14 w-12 rounded-lg bg-ink-100" />}
                  <div className="min-w-0 flex-1 text-sm">
                    {i.product ? <Link href={`/admin/productos/${i.product.id}`} className="font-medium hover:underline">{i.name}</Link> : <span className="font-medium">{i.name}</span>}
                    <p className="text-xs text-ink-500">{i.sku ? `SKU ${i.sku} · ` : ""}{formatPrice(i.unitPriceCents)} × {i.quantity}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{formatPrice(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Envío ({order.shippingRateName})</dt><dd className="tabular-nums">{formatPrice(order.shippingCents)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.totalCents)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Envío y seguimiento">
            <ActionForm action={updateShipment} className="space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="label">Transportista</span>
                  <select name="carrier" defaultValue={order.carrier} className="input">
                    {Object.entries(CARRIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="block"><span className="label">Nº de seguimiento</span>
                  <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" maxLength={60} placeholder="p. ej. PQ4B2C0123456789" />
                </label>
              </div>
              <label className="block"><span className="label">URL de seguimiento (opcional, se genera sola para Correos, GLS y DHL)</span>
                <input name="trackingUrl" defaultValue={order.trackingUrl ?? ""} className="input" placeholder="https://…" />
              </label>
              <div className="flex flex-wrap gap-2">
                <SubmitButton className="btn-secondary py-2.5">Guardar</SubmitButton>
                {canShip && <SubmitButton className="btn-primary py-2.5" name="markShipped" value="1">Guardar y marcar como enviado</SubmitButton>}
              </div>
            </ActionForm>
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm underline underline-offset-4">
                Ver seguimiento <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <div className="mt-6 rounded-xl bg-ink-50 p-4">
              <p className="text-sm font-medium">Etiqueta automática</p>
              <p className="mt-1 text-xs text-ink-500">
                Integraciones: {Object.values(carriers).map((c) => `${c.name} ${c.isConfigured() ? "✓ configurado" : "— sin configurar"}`).join(" · ")}
              </p>
              <ActionForm action={generateLabel} className="mt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <SubmitButton className="btn-secondary py-2">Generar etiqueta con {CARRIER_LABELS[order.carrier]}</SubmitButton>
              </ActionForm>
              {order.labelUrl && <a href={order.labelUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline">Descargar etiqueta</a>}
            </div>
          </Panel>

          <Panel title="Historial">
            <ol className="space-y-3 border-l border-ink-200 pl-4">
              {order.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-ink-900 ring-4 ring-white" />
                  <p>{e.message}</p>
                  <p className="text-xs text-ink-400">{e.createdAt.toLocaleString("es-ES")}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Estado del pedido">
            {transitions.length > 0 ? (
              <ActionForm action={updateOrderStatus} className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <select name="status" defaultValue={transitions[0]} className="input">
                  {transitions.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <SubmitButton className="btn-primary w-full py-2.5">Cambiar estado</SubmitButton>
              </ActionForm>
            ) : (
              <p className="text-sm text-ink-500">Este pedido está en un estado final.</p>
            )}
            <p className="mt-3 text-xs text-ink-400">El paso a «Pagado» lo realiza automáticamente el webhook de Stripe. Los reembolsos se hacen desde Stripe y se reflejan aquí solos.</p>
          </Panel>

          <Panel title="Cliente">
            <p className="font-medium">{order.shippingName}</p>
            <a href={`mailto:${order.email}`} className="block text-sm text-ink-600 underline-offset-2 hover:underline">{order.email}</a>
            <a href={`tel:${order.shippingPhone}`} className="block text-sm text-ink-600">{order.shippingPhone}</a>
            <Link href={`/admin/clientes/${order.customerId}`} className="mt-2 inline-block text-xs text-ink-500 hover:text-ink-900">
              {order.customer._count.orders} pedido(s) de este cliente →
            </Link>
          </Panel>

          <Panel title="Dirección de envío" actions={<CopyButton text={addressText} />}>
            <address className="whitespace-pre-line text-sm not-italic leading-relaxed">{addressText}</address>
          </Panel>

          <Panel title="Pago (Stripe)">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-ink-500">Payment Intent</dt><dd className="break-all font-mono text-xs">{order.stripePaymentIntentId ?? "—"}</dd></div>
              <div><dt className="text-xs text-ink-500">Riesgo Radar</dt><dd>{order.stripeRiskLevel ?? "—"}</dd></div>
            </dl>
            {order.stripePaymentIntentId && (
              <a href={`${stripeBase}/payments/${order.stripePaymentIntentId}`} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-4 w-full py-2">
                Ver en Stripe <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </Panel>

          <Panel title="Notas internas">
            <ActionForm action={saveOrderNotes} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea name="adminNotes" defaultValue={order.adminNotes ?? ""} rows={4} maxLength={2000} className="input" placeholder="Solo visibles en el panel" />
              <SubmitButton className="btn-secondary w-full py-2">Guardar notas</SubmitButton>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
