import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { CatalogView } from "@/components/shop/CatalogView";
import { parseCatalogParams } from "@/lib/catalog";
import { ProductImage } from "@/components/ui/ProductImage";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function getCategory(slug: string) {
  return prisma.category.findFirst({ where: { slug, active: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return {};
  return {
    title: c.name,
    description: c.description ?? `${c.name} en NOVASTORE`,
    openGraph: c.imageUrl && !c.imageUrl.endsWith(".svg") ? { images: [c.imageUrl] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const sp = parseCatalogParams(await searchParams);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-white">
        {category.imageUrl && (
          <div className="absolute inset-0 opacity-40">
            <ProductImage src={category.imageUrl} alt="" sizes="100vw" priority />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/80 to-ink-900/30" />
        <div className="container-ns relative py-16 sm:py-24">
          <p className="eyebrow mb-3 text-ink-400">Categoría</p>
          <h1 className="reveal text-4xl font-light tracking-tight sm:text-6xl">{category.name}</h1>
          {category.description && <p className="reveal mt-4 max-w-xl text-ink-300">{category.description}</p>}
        </div>
      </section>
      <div className="h-10" />
      <Suspense>
        <CatalogView params={sp} basePath={`/categoria/${slug}`} fixedCategory={slug} />
      </Suspense>
    </>
  );
}
