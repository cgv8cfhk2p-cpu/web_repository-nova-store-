import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { PAID_STATUSES } from "@/lib/order-status";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Ventas" };

const RANGES = [7, 30, 90, 365];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const since = new Date(Date.now() - days * 86400_000);
  const paidWhere: Prisma.OrderWhereInput = { status: { in: PAID_STATUSES }, paidAt: { gte: since } };

  const [agg, toShip, pendingPay, lowStock, recent, daily, top, allTime, units] = await Promise.all([
    prisma.order.aggregate({ where: paidWhere, _sum: { totalCents: true, shippingCents: true }, _count: true }),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({ where: { active: true, stock: { lte: 3 } }, orderBy: { stock: "asc" }, take: 8, select: { id: true, name: true, stock: true, isDemo: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, number: true, shippingName: true, totalCents: true, status: true, createdAt: true } }),
    prisma.$queryRaw<{ day: Date; total: bigint; orders: bigint }[]>`
      SELECT date_trunc('day', "paidAt") AS day, SUM("totalCents")::bigint AS total, COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE "status" IN ('PAID','PREPARING','SHIPPED','DELIVERED') AND "paidAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ name: string; productId: string | null; units: bigint; revenue: bigint }[]>`
      SELECT oi."name", oi."productId", SUM(oi."quantity")::bigint AS units, SUM(oi."quantity" * oi."unitPriceCents")::bigint AS revenue
      FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId"
      WHERE o."status" IN ('PAID','PREPARING','SHIPPED','DELIVERED') AND o."paidAt" >= ${since}
      GROUP BY oi."name", oi."productId" ORDER BY units DESC LIMIT 10`,
    prisma.order.aggregate({ where: { status: { in: PAID_STATUSES } }, _sum: { totalCents: true }, _count: true }),
    prisma.orderItem.aggregate({ where: { order: paidWhere }, _sum: { quantity: true } }),
  ]);

  const revenue = agg._sum.totalCents ?? 0;
  const orders = agg._count;
  const avg = orders ? Math.round(revenue / orders) : 0;
  const unitsSold = units._sum.quantity ?? 0;

  // Serie diaria completa (días sin ventas = 0)
  const map = new Map(daily.map((d) => [new Date(d.day).toISOString().slice(0, 10), Number(d.total)]));
  const series: { day: string; total: number }[] = [];
  const bucketDays = days > 90 ? 7 : 1;
  for (let i = days - 1; i >= 0; i -= bucketDays) {
    let total = 0;
    let label = "";
    for (let j = 0; j < bucketDays && i - j >= 0; j++) {
      const d = new Date(Date.now() - (i - j) * 86400_000).toISOString().slice(0, 10);
      if (!label) label = d;
      total += map.get(d) ?? 0;
    }
    series.push({ day: label, total });
  }
  const max = Math.max(1, ...series.map((s) => s.total));

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Solo se contabilizan pedidos con el pago confirmado por Stripe."
        actions={RANGES.map((r) => (
          <Link key={r} href={`/admin?dias=${r}`} className={`rounded-full px-3 py-1.5 text-xs font-medium ${r === days ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200"}`}>
            {r === 365 ? "1 año" : `${r} días`}
          </Link>
        ))}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={`Ingresos (${days} d)`} value={formatPrice(revenue)} />
        <Stat label="Pedidos pagados" value={String(orders)} />
        <Stat label="Ticket medio" value={formatPrice(avg)} />
        <Stat label="Unidades vendidas" value={String(unitsSold)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/pedidos?estado=PAID" className="rounded-2xl border border-ink-200 bg-white p-5 transition hover:border-ink-900">
          <p className="text-xs uppercase tracking-wider text-ink-500">Por preparar / enviar</p>
          <p className="mt-1 text-2xl font-semibold">{toShip}</p>
        </Link>
        <Link href="/admin/pedidos?estado=PENDING" className="rounded-2xl border border-ink-200 bg-white p-5 transition hover:border-ink-900">
          <p className="text-xs uppercase tracking-wider text-ink-500">Esperando pago</p>
          <p className="mt-1 text-2xl font-semibold">{pendingPay}</p>
        </Link>
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-ink-500">Histórico total</p>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(allTime._sum.totalCents ?? 0)}</p>
          <p className="text-xs text-ink-500">{allTime._count} pedidos</p>
        </div>
      </div>

      <Panel title="Evolución de ingresos" className="mt-6">
        <div className="flex h-48 items-end gap-[2px]" role="img" aria-label="Gráfico de ingresos por día">
          {series.map((s) => (
            <div key={s.day} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-ink-900/80 transition group-hover:bg-ink-900" style={{ height: `${Math.max(s.total ? 3 : 1, (s.total / max) * 100)}%`, opacity: s.total ? 1 : 0.15 }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-2 py-1 text-[11px] text-white group-hover:block">
                {new Date(s.day).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}: {formatPrice(s.total)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink-400">
          <span>{new Date(series[0].day).toLocaleDateString("es-ES")}</span>
          <span>Hoy</span>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Productos más vendidos">
          {top.length === 0 ? <p className="text-sm text-ink-500">Todavía no hay ventas en este periodo.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-ink-500"><th className="pb-2 font-medium">Producto</th><th className="pb-2 text-right font-medium">Uds.</th><th className="pb-2 text-right font-medium">Ingresos</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {top.map((t) => (
                  <tr key={`${t.productId}-${t.name}`}>
                    <td className="py-2 pr-2">{t.productId ? <Link className="hover:underline" href={`/admin/productos/${t.productId}`}>{t.name}</Link> : t.name}</td>
                    <td className="py-2 text-right tabular-nums">{Number(t.units)}</td>
                    <td className="py-2 text-right tabular-nums">{formatPrice(Number(t.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Últimos pedidos" actions={<Link href="/admin/pedidos" className="text-xs text-ink-500 hover:text-ink-900">Ver todos</Link>}>
          {recent.length === 0 ? <p className="text-sm text-ink-500">Aún no hay pedidos.</p> : (
            <ul className="divide-y divide-ink-100">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:opacity-70">
                    <span className="min-w-0"><span className="font-medium">#{o.number}</span> <span className="text-ink-500">{o.shippingName}</span></span>
                    <span className="flex shrink-0 items-center gap-3"><span className="tabular-nums">{formatPrice(o.totalCents)}</span><StatusBadge status={o.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {lowStock.length > 0 && (
        <Panel title="Stock bajo (≤ 3 uds.)" className="mt-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {lowStock.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/productos/${p.id}`} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm hover:bg-ink-100">
                  <span className="flex min-w-0 items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /><span className="truncate">{p.name}</span></span>
                  <span className={`shrink-0 font-semibold ${p.stock === 0 ? "text-rose-700" : ""}`}>{p.stock}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}
