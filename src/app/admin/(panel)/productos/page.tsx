import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus, Search, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { Flash, PageHeader, Pager } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { deleteDemoContent, toggleProduct } from "@/app/admin/_actions/products";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const metadata = { title: "Productos" };
const PER_PAGE = 30;

type SP = { q?: string; categoria?: string; estado?: string; pagina?: string; eliminado?: string; demos?: string; stock?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const where: Prisma.ProductWhereInput = {};
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q, mode: "insensitive" } },
      { brand: { contains: sp.q, mode: "insensitive" } },
      { sku: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.categoria) where.categoryId = sp.categoria;
  if (sp.estado === "activos") where.active = true;
  if (sp.estado === "inactivos") where.active = false;
  if (sp.estado === "demo") where.isDemo = true;
  if (sp.stock === "bajo") where.stock = { lte: 3 };

  const [total, products, categories, demoCount] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { images: { orderBy: { position: "asc" }, take: 1 }, category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.count({ where: { isDemo: true } }),
  ]);

  const href = (p: number) => {
    const s = new URLSearchParams();
    if (sp.q) s.set("q", sp.q);
    if (sp.categoria) s.set("categoria", sp.categoria);
    if (sp.estado) s.set("estado", sp.estado);
    if (sp.stock) s.set("stock", sp.stock);
    if (p > 1) s.set("pagina", String(p));
    return `/admin/productos?${s}`;
  };

  return (
    <>
      <PageHeader
        title="Productos"
        description={`${total} productos`}
        actions={<Link href="/admin/productos/nuevo" className="btn-primary py-2.5"><Plus className="h-4 w-4" /> Añadir producto</Link>}
      />
      {sp.eliminado && <Flash>Producto eliminado.</Flash>}
      {sp.demos && <Flash>Se han eliminado {sp.demos} productos de demostración.</Flash>}

      {demoCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>Hay <strong>{demoCount} productos de demostración</strong>. Elimínalos cuando añadas tu catálogo real.</span>
          <form action={deleteDemoContent}>
            <ConfirmButton message={`¿Eliminar los ${demoCount} productos de demostración? Esta acción no se puede deshacer.`} className="btn bg-amber-900 px-4 py-2 text-white hover:bg-amber-800">
              Eliminar productos demo
            </ConfirmButton>
          </form>
        </div>
      )}

      <form className="mb-4 flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3">
          <Search className="h-4 w-4 text-ink-400" />
          <input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, marca o SKU" className="w-full bg-transparent py-2.5 text-sm outline-none" />
        </div>
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="input w-auto py-2.5">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="estado" defaultValue={sp.estado ?? ""} className="input w-auto py-2.5">
          <option value="">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Desactivados</option>
          <option value="demo">Demostración</option>
        </select>
        <select name="stock" defaultValue={sp.stock ?? ""} className="input w-auto py-2.5">
          <option value="">Cualquier stock</option>
          <option value="bajo">Stock bajo (≤3)</option>
        </select>
        <button className="btn-secondary py-2.5">Filtrar</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 text-right font-medium">Precio</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Destacado</th>
              <th className="px-4 py-3 text-center font-medium">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((p) => (
              <tr key={p.id} className={p.active ? "" : "bg-ink-50 text-ink-500"}>
                <td className="px-4 py-3">
                  <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.images[0] ? <img src={p.images[0].url} alt="" className="h-12 w-10 shrink-0 rounded-md bg-ink-100 object-cover" /> : <div className="h-12 w-10 shrink-0 rounded-md bg-ink-100" />}
                    <span className="min-w-0">
                      <span className="block font-medium text-ink-900 hover:underline">{p.name}</span>
                      <span className="flex items-center gap-2 text-xs text-ink-400">{p.brand}{p.sku ? ` · ${p.sku}` : ""} {p.isDemo && <DemoBadge />}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPrice(p.priceCents)}
                  {p.compareAtCents && <span className="block text-xs text-ink-400 line-through">{formatPrice(p.compareAtCents)}</span>}
                </td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${p.stock === 0 ? "text-rose-700" : p.stock <= 3 ? "text-amber-700" : ""}`}>{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="field" value="featured" />
                    <button aria-label="Cambiar destacado" className={p.featured ? "text-ink-900" : "text-ink-300 hover:text-ink-500"}>
                      <Star className="h-4 w-4" fill={p.featured ? "currentColor" : "none"} />
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-center">
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="field" value="active" />
                    <button aria-label={p.active ? "Desactivar" : "Activar"} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${p.active ? "bg-ink-900" : "bg-ink-300"}`}>
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${p.active ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-500">No hay productos.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} href={href} />
    </>
  );
}
