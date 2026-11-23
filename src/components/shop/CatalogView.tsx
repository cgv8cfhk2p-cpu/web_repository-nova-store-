import Link from "next/link";
import { getCategories, searchProducts, type CatalogParams } from "@/lib/catalog";
import { ProductGrid } from "./ProductCard";
import { CatalogFilters } from "./CatalogFilters";

/** Vista de catálogo reutilizada por /tienda, /categoria/[slug] y /ofertas. */
export async function CatalogView({
  params,
  basePath,
  fixedCategory,
  fixedOnSale = false,
}: {
  params: CatalogParams;
  basePath: string;
  fixedCategory?: string;
  fixedOnSale?: boolean;
}) {
  const effective = { ...params, category: fixedCategory ?? params.category, onSale: fixedOnSale || params.onSale };
  const [result, categories] = await Promise.all([searchProducts(effective), getCategories()]);

  const qs = (page: number) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (!fixedCategory && params.category) sp.set("categoria", params.category);
    if (params.min != null) sp.set("min", String(params.min));
    if (params.max != null) sp.set("max", String(params.max));
    if (params.sort) sp.set("orden", params.sort);
    if (!fixedOnSale && params.onSale) sp.set("ofertas", "1");
    if (page > 1) sp.set("pagina", String(page));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="container-ns pb-8">
      <CatalogFilters
        categories={categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products }))}
        current={{ ...params, sort: result.sort }}
        showCategory={!fixedCategory}
        showOnSale={!fixedOnSale}
        total={result.total}
      />

      {result.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 py-24 text-center">
          <p className="text-lg font-light">No hemos encontrado productos.</p>
          <p className="mt-2 text-sm text-ink-500">Prueba con otros filtros o términos de búsqueda.</p>
          <Link href={basePath} className="btn-secondary mt-6">Quitar filtros</Link>
        </div>
      ) : (
        <ProductGrid products={result.products} priorityCount={4} />
      )}

      {result.pages > 1 && (
        <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Paginación">
          {result.page > 1 && <Link href={qs(result.page - 1)} className="btn-secondary px-4 py-2">Anterior</Link>}
          {Array.from({ length: result.pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === result.pages || Math.abs(n - result.page) <= 1)
            .map((n, idx, arr) => (
              <span key={n} className="flex items-center gap-2">
                {idx > 0 && n - arr[idx - 1] > 1 && <span className="text-ink-400">…</span>}
                <Link
                  href={qs(n)}
                  aria-current={n === result.page ? "page" : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${
                    n === result.page ? "bg-ink-900 text-white" : "hover:bg-ink-100"
                  }`}
                >
                  {n}
                </Link>
              </span>
            ))}
          {result.page < result.pages && <Link href={qs(result.page + 1)} className="btn-secondary px-4 py-2">Siguiente</Link>}
        </nav>
      )}
    </div>
  );
}

export function PageHero({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string | null }) {
  return (
    <section className="container-ns pb-8 pt-12 sm:pt-16">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-4xl font-light tracking-tight sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-ink-500">{description}</p>}
    </section>
  );
}
