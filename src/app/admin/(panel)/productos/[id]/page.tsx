import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { Flash, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteProduct } from "@/app/admin/_actions/products";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [p, categories, sold] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.orderItem.aggregate({ where: { productId: id, order: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } }, _sum: { quantity: true } }),
  ]);
  if (!p) notFound();

  return (
    <>
      <Link href="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Productos</Link>
      <PageHeader
        title={p.name}
        description={`${sold._sum.quantity ?? 0} unidades vendidas`}
        actions={
          <>
            <Link href={`/producto/${p.slug}`} target="_blank" className="btn-secondary py-2"><ExternalLink className="h-4 w-4" /> Ver en tienda</Link>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton message="¿Eliminar este producto definitivamente? Si solo quieres ocultarlo, desactívalo." className="btn border border-rose-200 py-2 text-rose-700 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" /> Eliminar
              </ConfirmButton>
            </form>
          </>
        }
      />
      {sp.creado && <Flash>Producto creado correctamente.</Flash>}
      <ProductForm
        categories={categories}
        values={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand ?? "",
          sku: p.sku ?? "",
          categoryId: p.categoryId,
          description: p.description,
          price: centsToInput(p.priceCents),
          compareAt: centsToInput(p.compareAtCents),
          stock: p.stock,
          weightGrams: p.weightGrams?.toString() ?? "",
          active: p.active,
          featured: p.featured,
          isDemo: p.isDemo,
          images: p.images.map((i) => ({ id: i.id, url: i.url })),
        }}
      />
    </>
  );
}
