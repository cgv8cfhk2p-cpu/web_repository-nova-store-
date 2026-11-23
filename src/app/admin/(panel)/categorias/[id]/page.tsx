import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Flash, PageHeader, Panel } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteCategory } from "@/app/admin/_actions/categories";

export const metadata = { title: "Editar categoría" };

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const c = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!c) notFound();
  return (
    <>
      <Link href="/admin/categorias" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Categorías</Link>
      <PageHeader
        title={c.name}
        description={`${c._count.products} productos`}
        actions={
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton message="¿Eliminar esta categoría?" className="btn border border-rose-200 py-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Eliminar</ConfirmButton>
          </form>
        }
      />
      {sp.error === "productos" && <Flash type="error">No se puede eliminar una categoría con productos. Muévelos a otra categoría o desactívala.</Flash>}
      <Panel className="max-w-3xl">
        <CategoryForm values={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder, active: c.active, imageUrl: c.imageUrl }} />
      </Panel>
    </>
  );
}
