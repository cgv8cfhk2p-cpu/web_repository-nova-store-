import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { Price } from "@/components/ui/Price";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Gallery } from "@/components/shop/Gallery";
import { AddToCart } from "@/components/shop/AddToCart";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { store } from "@/config/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const img = p.images.find((i) => !i.url.endsWith(".svg"))?.url;
  return {
    title: p.brand ? `${p.name} · ${p.brand}` : p.name,
    description: p.description.slice(0, 160),
    robots: p.isDemo ? { index: false } : undefined,
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: img ? [img] : undefined, type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const related = await getRelated(p.id, p.categoryId);

  const jsonLd = !p.isDemo
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.description,
        brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
        sku: p.sku ?? undefined,
        image: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${store.siteUrl}${i.url}`)),
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: (p.priceCents / 100).toFixed(2),
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${store.siteUrl}/producto/${p.slug}`,
        },
      }
    : null;

  return (
    <div className="container-ns pt-6 sm:pt-10">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <nav aria-label="Ruta" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-ink-500">
        <Link href="/" className="hover:text-ink-900">Inicio</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/categoria/${p.category.slug}`} className="hover:text-ink-900">{p.category.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-ink-900">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Gallery images={p.images.map((i) => ({ url: i.url, alt: i.alt || p.name }))} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            {p.isDemo && (
              <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="mb-1 flex items-center gap-2 font-semibold"><DemoBadge /> Producto de demostración</div>
                Este artículo es contenido de ejemplo para mostrar el funcionamiento de la tienda. No es un producto real a la venta.
              </div>
            )}
            {p.brand && <p className="eyebrow mb-2">{p.brand}</p>}
            <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl">{p.name}</h1>
            <div className="mt-4">
              <Price cents={p.priceCents} compareAt={p.compareAtCents} size="lg" />
              <p className="mt-1 text-xs text-ink-500">IVA incluido. Gastos de envío calculados en el carrito.</p>
            </div>

            <div className="mt-8">
              <AddToCart
                product={{
                  productId: p.id,
                  name: p.name,
                  slug: p.slug,
                  brand: p.brand,
                  priceCents: p.priceCents,
                  imageUrl: p.images[0]?.url ?? null,
                  stock: p.stock,
                  isDemo: p.isDemo,
                }}
              />
              <p className={`mt-3 text-sm ${p.stock > 0 ? (p.stock <= 5 ? "text-amber-700" : "text-emerald-700") : "text-ink-500"}`}>
                {p.stock <= 0 ? "Agotado temporalmente" : p.stock <= 5 ? `¡Solo quedan ${p.stock} unidades!` : "En stock · Envío en 24/48 h"}
              </p>
            </div>

            <div className="mt-10 border-t border-ink-100 pt-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Descripción</h2>
              <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink-600">{p.description}</div>
              {p.sku && <p className="mt-4 text-xs text-ink-400">Ref.: {p.sku}</p>}
            </div>

            <ul className="mt-8 space-y-3 border-t border-ink-100 pt-8 text-sm">
              <li className="flex gap-3"><Truck className="h-5 w-5 shrink-0" strokeWidth={1.5} /> <span>Envío a España y Europa. <Link href="/envios" className="underline underline-offset-4">Ver plazos y tarifas</Link></span></li>
              <li className="flex gap-3"><RotateCcw className="h-5 w-5 shrink-0" strokeWidth={1.5} /> <span>{store.returnDays} días para devolverlo. <Link href="/devoluciones" className="underline underline-offset-4">Política de devoluciones</Link></span></li>
              <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.5} /> <span>Pago seguro con Stripe: tarjeta, Apple Pay y Google Pay.</span></li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <SectionHeading eyebrow="También te puede gustar" title={`Más en ${p.category.name}`} href={`/categoria/${p.category.slug}`} />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
