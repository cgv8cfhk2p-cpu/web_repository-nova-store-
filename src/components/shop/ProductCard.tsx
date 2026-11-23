import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "@/components/ui/Price";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { discountPercent } from "@/lib/money";
import { QuickAdd } from "./QuickAdd";

const NEW_DAYS = 21;

export function ProductCard({ p, priority = false }: { p: ProductCardData; priority?: boolean }) {
  const pct = discountPercent(p.priceCents, p.compareAtCents);
  const isNew = Date.now() - new Date(p.createdAt).getTime() < NEW_DAYS * 86400_000;
  const img = p.images[0];
  const img2 = p.images[1];
  return (
    <article className="group relative flex flex-col">
      <Link href={`/producto/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100">
        <ProductImage
          src={img?.url}
          alt={img?.alt || p.name}
          priority={priority}
          className="transition duration-700 ease-out group-hover:scale-[1.04]"
        />
        {img2 && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <ProductImage src={img2.url} alt={img2.alt || p.name} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {p.isDemo && <DemoBadge />}
          {pct && <span className="badge bg-ink-900 text-white">−{pct}%</span>}
          {!pct && isNew && <span className="badge bg-white text-ink-900">Nuevo</span>}
          {p.stock <= 0 && <span className="badge bg-white/90 text-ink-500">Agotado</span>}
        </div>
      </Link>
      <QuickAdd
        product={{
          productId: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          priceCents: p.priceCents,
          imageUrl: img?.url ?? null,
          stock: p.stock,
          isDemo: p.isDemo,
        }}
      />
      <div className="mt-4 space-y-1 px-0.5">
        {p.brand && <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">{p.brand}</p>}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <Link href={`/producto/${p.slug}`}>{p.name}</Link>
        </h3>
        <Price cents={p.priceCents} compareAt={p.compareAtCents} size="sm" />
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
