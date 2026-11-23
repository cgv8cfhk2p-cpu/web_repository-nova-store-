import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView, PageHero } from "@/components/shop/CatalogView";
import { parseCatalogParams } from "@/lib/catalog";

export const metadata: Metadata = { title: "Ofertas", description: "Ofertas y promociones de NOVASTORE." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OffersPage({ searchParams }: Props) {
  const params = parseCatalogParams(await searchParams);
  return (
    <>
      <PageHero eyebrow="Promociones" title="Ofertas" description="Productos con precio rebajado durante tiempo limitado o hasta agotar existencias." />
      <Suspense>
        <CatalogView params={params} basePath="/ofertas" fixedOnSale />
      </Suspense>
    </>
  );
}
