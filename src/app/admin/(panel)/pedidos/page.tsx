import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { Download, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/order-status";
import { ordersWhere } from "@/lib/admin-queries";
import { countryName } from "@/lib/countries";
import { PageHeader, Pager, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Pedidos" };
const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const where = ordersWhere(sp);
  const [total, orders, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const href = (changes: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { estado: sp.estado, q: sp.q, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/pedidos?${s}` : "/admin/pedidos";
  };

  return (
    <>
      <PageHeader
        title="Pedidos"
        description={`${total} pedidos`}
        actions={
          <a href={`/api/admin/orders/export?${new URLSearchParams({ ...(sp.estado ? { estado: sp.estado } : {}), ...(sp.q ? { q: sp.q } : {}) })}`} className="btn-secondary py-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        }
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ estado: undefined, pagina: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${!sp.estado ? "bg-ink-900 text-white" : "bg-white ring-1 ring-ink-200"}`}>Todos</Link>
        {STATUS_ORDER.map((s) => (
          <Link key={s} href={href({ estado: s, pagina: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${sp.estado === s ? "bg-ink-900 text-white" : "bg-white ring-1 ring-ink-200"}`}>
            {STATUS_LABELS[s]} <span className="opacity-60">{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-ink-200 bg-white px-3">
        {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
        <Search className="h-4 w-4 text-ink-400" />
        <input name="q" defaultValue={sp.q} placeholder="Nº pedido, nombre, email, CP, seguimiento…" className="w-full bg-transparent py-2.5 text-sm outline-none" />
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Destino</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-semibold hover:underline">#{o.number}</Link>
                  <span className="block text-xs text-ink-400">{o._count.items} artículo(s)</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{o.createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-4 py-3"><span className="block">{o.shippingName}</span><span className="text-xs text-ink-400">{o.email}</span></td>
                <td className="px-4 py-3 text-ink-600">{o.shippingCity}, {countryName(o.shippingCountry)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                  {o.stripeRiskLevel && o.stripeRiskLevel !== "normal" && <span className="badge ml-1 bg-rose-100 text-rose-800">Riesgo</span>}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPrice(o.totalCents)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-500">No hay pedidos con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={(p) => href({ pagina: String(p) })} />
    </>
  );
}
