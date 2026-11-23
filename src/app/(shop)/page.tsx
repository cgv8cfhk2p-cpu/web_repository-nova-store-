import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getCategories, getFeatured, getNewArrivals, getOnSale } from "@/lib/catalog";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { ProductImage } from "@/components/ui/ProductImage";
import { HomeSearch } from "@/components/shop/HomeSearch";
import { store } from "@/config/store";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featured, newest, onSale] = await Promise.all([
    getCategories(),
    getFeatured(8),
    getNewArrivals(8),
    getOnSale(4),
  ]);

  return (
    <>
      {/* Banner principal */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-gradient-to-br from-white/15 to-transparent blur-3xl" />
          <div className="absolute -bottom-48 -left-24 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="white" strokeWidth=".6"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>
        <div className="container-ns relative grid min-h-[78vh] items-center gap-12 py-20 lg:min-h-[640px] lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="eyebrow reveal mb-6 text-ink-400">Nueva temporada · Multimarca</p>
            <h1 className="reveal text-[44px] font-extralight leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              Lo que quieres,<br />
              <span className="font-semibold">en un solo lugar.</span>
            </h1>
            <p className="reveal mt-6 max-w-lg text-base leading-relaxed text-ink-400 sm:text-lg" style={{ animationDelay: "160ms" }}>
              {store.tagline} Envío rápido y pago seguro con Stripe.
            </p>
            <div className="reveal mt-10 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link href="/tienda" className="btn bg-white text-ink-900 hover:bg-ink-200">
                Comprar ahora <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/ofertas" className="btn border border-white/25 text-white hover:border-white">
                Ver ofertas
              </Link>
            </div>
          </div>
          <div className="reveal hidden lg:col-span-5 lg:block" style={{ animationDelay: "300ms" }}>
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 4).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/categoria/${c.slug}`}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 ${i % 2 ? "translate-y-10" : ""}`}
                >
                  <ProductImage src={c.imageUrl} alt={c.name} sizes="20vw" priority className="opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Buscador */}
      <section className="container-ns -mt-8 relative z-10">
        <HomeSearch />
      </section>

      {/* Ventajas */}
      <section className="container-ns mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { icon: Truck, t: "Envío rápido", d: "Entrega en 24-72 h en España peninsular" },
          { icon: ShieldCheck, t: "Pago 100% seguro", d: "Tarjeta, Apple Pay y Google Pay con Stripe" },
          { icon: RotateCcw, t: `${store.returnDays} días para devolver`, d: "Devoluciones sencillas y sin complicaciones" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-4 rounded-2xl bg-ink-50 p-5">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold">{t}</p>
              <p className="mt-0.5 text-sm text-ink-500">{d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section className="container-ns mt-24">
          <SectionHeading eyebrow="Explora" title="Compra por categoría" href="/tienda" linkLabel="Toda la tienda" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/categoria/${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100">
                <ProductImage src={c.imageUrl} alt={c.name} sizes="(min-width:1024px) 25vw, 50vw" className="transition duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white sm:p-6">
                  <div>
                    <h3 className="text-base font-medium sm:text-xl">{c.name}</h3>
                    <p className="text-xs text-white/70">{c._count.products} productos</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-900 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="container-ns mt-24">
          <SectionHeading eyebrow="Selección NOVASTORE" title="Productos destacados" href="/tienda" />
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Ofertas */}
      {onSale.length > 0 && (
        <section className="mt-24 bg-ink-50 py-20">
          <div className="container-ns">
            <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="eyebrow mb-2">Ofertas y promociones</p>
                <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
                  Precios especiales, <span className="font-semibold">por tiempo limitado.</span>
                </h2>
              </div>
              <div className="lg:col-span-5 lg:text-right">
                <Link href="/ofertas" className="btn-primary">Ver todas las ofertas <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <ProductGrid products={onSale} />
          </div>
        </section>
      )}

      {/* Novedades */}
      {newest.length > 0 && (
        <section className="container-ns mt-24">
          <SectionHeading eyebrow="Recién llegados" title="Últimas novedades" href="/tienda?orden=recientes" />
          <ProductGrid products={newest} />
        </section>
      )}

      {categories.length === 0 && (
        <section className="container-ns py-24 text-center text-ink-500">
          La tienda todavía no tiene productos. Añádelos desde el panel de administración.
        </section>
      )}

      {/* Redes sociales */}
      <section className="container-ns mt-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center text-white sm:px-12">
          <p className="eyebrow mb-3 text-ink-400">@novastore</p>
          <h2 className="mx-auto max-w-2xl text-3xl font-light tracking-tight sm:text-4xl">
            Síguenos en <span className="font-semibold">TikTok</span> e <span className="font-semibold">Instagram</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink-400">Lanzamientos, ofertas exclusivas y lo más buscado de la semana.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="btn bg-white text-ink-900 hover:bg-ink-200">Instagram</a>}
            {store.tiktok && <a href={store.tiktok} target="_blank" rel="noopener noreferrer" className="btn border border-white/25 hover:border-white">TikTok</a>}
          </div>
        </div>
      </section>
    </>
  );
}
