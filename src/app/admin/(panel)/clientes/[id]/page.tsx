import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { countryName } from "@/lib/countries";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Cliente" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.customer.findUnique({ where: { id }, include: { orders: { orderBy: { createdAt: "desc" } } } });
  if (!c) notFound();
  const addresses = [...new Map(c.orders.map((o) => {
    const a = `${o.shippingAddress1}${o.shippingAddress2 ? `, ${o.shippingAddress2}` : ""}\n${o.shippingPostalCode} ${o.shippingCity} (${o.shippingProvince})\n${countryName(o.shippingCountry)}`;
    return [a, a];
  })).values()];
  return (
    <>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Clientes</Link>
      <PageHeader title={c.fullName} description={`Cliente desde ${c.createdAt.toLocaleDateString("es-ES")}`} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Panel title="Contacto">
            <a href={`mailto:${c.email}`} className="block text-sm underline-offset-2 hover:underline">{c.email}</a>
            <a href={`tel:${c.phone}`} className="block text-sm text-ink-600">{c.phone}</a>
          </Panel>
          <Panel title="Direcciones usadas">
            <ul className="space-y-3">
              {addresses.map((a) => <li key={a} className="whitespace-pre-line rounded-lg bg-ink-50 p-3 text-sm">{a}</li>)}
            </ul>
          </Panel>
        </div>
        <Panel title={`Pedidos (${c.orders.length})`} className="xl:col-span-2">
          <ul className="divide-y divide-ink-100">
            {c.orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:opacity-70">
                  <span><span className="font-medium">#{o.number}</span> <span className="text-ink-500">{o.createdAt.toLocaleDateString("es-ES")}</span></span>
                  <span className="flex items-center gap-3"><span className="tabular-nums">{formatPrice(o.totalCents)}</span><StatusBadge status={o.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
