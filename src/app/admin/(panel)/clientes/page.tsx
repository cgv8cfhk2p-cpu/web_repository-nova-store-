import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { PAID_STATUSES } from "@/lib/order-status";
import { PageHeader, Pager } from "@/components/admin/ui";

export const metadata = { title: "Clientes" };
const PER_PAGE = 30;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const where: Prisma.CustomerWhereInput = sp.q
    ? { OR: [{ fullName: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { phone: { contains: sp.q } }] }
    : {};
  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
  ]);
  const stats = await prisma.order.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customers.map((c) => c.id) }, status: { in: PAID_STATUSES } },
    _sum: { totalCents: true },
    _count: true,
  });
  const statOf = (id: string) => stats.find((s) => s.customerId === id);

  return (
    <>
      <PageHeader title="Clientes" description={`${total} clientes · datos recogidos en el checkout`} />
      <form className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-ink-200 bg-white px-3">
        <Search className="h-4 w-4 text-ink-400" />
        <input name="q" defaultValue={sp.q} placeholder="Nombre, email o teléfono" className="w-full bg-transparent py-2.5 text-sm outline-none" />
      </form>
      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Teléfono</th><th className="px-4 py-3 text-right font-medium">Pedidos pagados</th><th className="px-4 py-3 text-right font-medium">Total gastado</th><th className="px-4 py-3 font-medium">Alta</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-ink-50">
                <td className="px-4 py-3"><Link href={`/admin/clientes/${c.id}`} className="font-medium hover:underline">{c.fullName}</Link><span className="block text-xs text-ink-400">{c.email}</span></td>
                <td className="px-4 py-3 text-ink-600">{c.phone}</td>
                <td className="px-4 py-3 text-right tabular-nums">{statOf(c.id)?._count ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPrice(statOf(c.id)?._sum.totalCents ?? 0)}</td>
                <td className="px-4 py-3 text-ink-500">{c.createdAt.toLocaleDateString("es-ES")}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={5} className="px-4 py-16 text-center text-ink-500">No hay clientes.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={(p) => `/admin/clientes?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), pagina: String(p) })}`} />
    </>
  );
}
