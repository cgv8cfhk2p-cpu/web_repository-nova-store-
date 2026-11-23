import Link from "next/link";
import { prisma } from "@/lib/db";
import { Flash, PageHeader, Panel } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "Categorías" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ creada?: string; eliminada?: string }> }) {
  const sp = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <PageHeader title="Categorías" description="Cada categoría tiene su propia página en la tienda." />
      {sp.creada && <Flash>Categoría creada.</Flash>}
      {sp.eliminada && <Flash>Categoría eliminada.</Flash>}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((c) => (
              <Link key={c.id} href={`/admin/categorias/${c.id}`} className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-3 transition hover:border-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-16 w-14 rounded-lg bg-ink-100 object-cover" /> : <div className="h-16 w-14 rounded-lg bg-ink-100" />}
                <div className="min-w-0">
                  <p className="font-medium">{c.name} {!c.active && <span className="badge bg-ink-100 text-ink-500">Oculta</span>}</p>
                  <p className="text-xs text-ink-500">/categoria/{c.slug} · {c._count.products} productos</p>
                </div>
              </Link>
            ))}
            {categories.length === 0 && <p className="text-sm text-ink-500">Todavía no hay categorías.</p>}
          </div>
        </div>
        <div className="xl:col-span-2">
          <Panel title="Nueva categoría">
            <CategoryForm values={{ name: "", slug: "", description: "", sortOrder: categories.length, active: true, imageUrl: null }} />
          </Panel>
        </div>
      </div>
    </>
  );
}
