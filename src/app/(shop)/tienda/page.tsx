import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView, PageHero } from "@/components/shop/CatalogView";
import { parseCatalogParams } from "@/lib/catalog";

export const metadata: Metadata = { title: "Tienda", description: "Todos los productos de NOVASTORE: perfumes, tecnología, zapatillas y ropa." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ShopPage({ searchParams }: Props) {
  const params = parseCatalogParams(await searchParams);
  return (
    <>
      <PageHero eyebrow="Catálogo" title={params.q ? "Búsqueda" : "Toda la tienda"} />
      <Suspense>
        <CatalogView params={params} basePath="/tienda" />
      </Suspense>
    </>
  );
}
