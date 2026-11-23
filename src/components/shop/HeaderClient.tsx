"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCart } from "./CartProvider";

type Cat = { name: string; slug: string };

export function HeaderClient({ categories, announcement, testMode }: { categories: Cat[]; announcement: string; testMode: boolean }) {
  const { count, setOpen, ready } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const nav = [{ name: "Tienda", slug: "" }, ...categories.slice(0, 5), { name: "Ofertas", slug: "__ofertas" }];
  const hrefFor = (c: Cat) => (c.slug === "" ? "/tienda" : c.slug === "__ofertas" ? "/ofertas" : `/categoria/${c.slug}`);

  return (
    <>
      {testMode && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-[11px] font-medium text-ink-900">
          Modo de pruebas: los pagos no son reales y el catálogo contiene productos de demostración.
        </div>
      )}
      <div className="bg-ink-900 px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white">
        {announcement}
      </div>
      <header
        className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "border-ink-200 shadow-[0_1px_20px_rgba(0,0,0,0.04)]" : "border-transparent"
        }`}
      >
        <div className="container-ns flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <div className="flex items-center gap-1 lg:hidden">
            <button aria-label="Abrir menú" className="-ml-2 p-2" onClick={() => setMenu(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <button aria-label="Buscar" className="p-2" onClick={() => setSearch((v) => !v)}>
              <Search className="h-5 w-5" />
            </button>
          </div>

          <Logo className="lg:mr-8" />

          <nav className="hidden flex-1 items-center gap-7 lg:flex" aria-label="Principal">
            {nav.map((c) => {
              const href = hrefFor(c);
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative text-[13px] font-medium tracking-wide transition-colors hover:text-ink-900 ${
                    active ? "text-ink-900" : "text-ink-500"
                  } after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-ink-900 after:transition-all after:duration-300 ${
                    active ? "after:w-full" : "after:w-0 hover:after:w-full"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button aria-label="Buscar" className="hidden p-2 text-ink-700 transition hover:text-ink-900 lg:block" onClick={() => setSearch((v) => !v)}>
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label={`Abrir carrito (${count} artículos)`}
              className="relative -mr-2 p-2 text-ink-700 transition hover:text-ink-900"
              onClick={() => setOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] animate-fade-in items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        {search && <SearchBar onClose={() => setSearch(false)} />}
      </header>

      {/* Menú móvil */}
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm animate-fade-in flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-5">
              <Logo />
              <button aria-label="Cerrar menú" className="-mr-2 p-2" onClick={() => setMenu(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-6">
              <ul className="space-y-1">
                <li>
                  <Link href="/" className="block py-3 text-2xl font-light">Inicio</Link>
                </li>
                {nav.map((c) => (
                  <li key={hrefFor(c)}>
                    <Link href={hrefFor(c)} className="block py-3 text-2xl font-light">
                      {c.name}
                    </Link>
                  </li>
                ))}
                {categories.slice(5).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categoria/${c.slug}`} className="block py-3 text-2xl font-light">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-ink-100 px-5 py-5 text-sm text-ink-500">
              <Link href="/envios" className="block py-1.5">Envíos</Link>
              <Link href="/devoluciones" className="block py-1.5">Devoluciones</Link>
              <Link href="/contacto" className="block py-1.5">Contacto</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="animate-fade-in border-t border-ink-100 bg-white">
      <form
        className="container-ns flex items-center gap-3 py-4"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/tienda?q=${encodeURIComponent(q.trim())}`);
        }}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <Search className="h-5 w-5 shrink-0 text-ink-400" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          name="q"
          maxLength={80}
          placeholder="Buscar perfumes, auriculares, zapatillas…"
          className="w-full bg-transparent text-base outline-none placeholder:text-ink-400 sm:text-lg"
          aria-label="Buscar productos"
        />
        <button type="button" onClick={onClose} aria-label="Cerrar búsqueda" className="p-1 text-ink-400 hover:text-ink-900">
          <X className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
