import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Link href="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Productos</Link>
      <PageHeader title="Nuevo producto" />
      {categories.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Primero crea una <Link href="/admin/categorias" className="underline">categoría</Link>.</p>
      ) : (
        <ProductForm
          categories={categories}
          values={{ name: "", slug: "", brand: "", sku: "", categoryId: "", description: "", price: "", compareAt: "", stock: 0, weightGrams: "", active: true, featured: false, isDemo: false, images: [] }}
        />
      )}
    </>
  );
}
