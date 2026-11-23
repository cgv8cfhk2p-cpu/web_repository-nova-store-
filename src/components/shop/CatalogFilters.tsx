"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";

type Cat = { name: string; slug: string; count: number };
type Current = { q?: string; category?: string; min?: number; max?: number; sort?: string; onSale?: boolean };

const SORT_OPTIONS = [
  ["recientes", "Novedades"],
  ["precio-asc", "Precio: menor a mayor"],
  ["precio-desc", "Precio: mayor a menor"],
  ["nombre", "Nombre (A-Z)"],
];

export function CatalogFilters({
  categories,
  current,
  showCategory,
  showOnSale,
  total,
}: {
  categories: Cat[];
  current: Current;
  showCategory: boolean;
  showOnSale: boolean;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(current.min?.toString() ?? "");
  const [max, setMax] = useState(current.max?.toString() ?? "");

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("pagina");
    const s = next.toString();
    start(() => router.push(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };

  const activeCount =
    (showCategory && current.category ? 1 : 0) + (current.min != null || current.max != null ? 1 : 0) + (showOnSale && current.onSale ? 1 : 0);

  return (
    <div className="mb-10">
      {current.q && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-500">Resultados para</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 font-medium">
            «{current.q}»
            <button onClick={() => update({ q: null })} aria-label="Quitar búsqueda"><X className="h-3.5 w-3.5" /></button>
          </span>
        </div>
      )}

      {showCategory && (
        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip active={!current.category} onClick={() => update({ categoria: null })}>Todo</Chip>
          {categories.map((c) => (
            <Chip key={c.slug} active={current.category === c.slug} onClick={() => update({ categoria: c.slug })}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-3 border-y border-ink-100 py-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros {activeCount > 0 && <span className="rounded-full bg-ink-900 px-2 text-xs text-white">{activeCount}</span>}
        </button>
        <span className="hidden text-sm text-ink-500 sm:block">{total} {total === 1 ? "producto" : "productos"}</span>
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-ink-500 sm:inline">Ordenar:</span>
          <select
            value={current.sort ?? "recientes"}
            onChange={(e) => update({ orden: e.target.value === "recientes" ? null : e.target.value })}
            className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-ink-900"
            aria-label="Ordenar productos"
          >
            {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      {open && (
        <div className="animate-fade-in grid gap-6 border-b border-ink-100 py-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              update({ min: min || null, max: max || null });
            }}
          >
            <div>
              <label className="label" htmlFor="f-min">Precio mín. (€)</label>
              <input id="f-min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value.replace(/[^0-9.,]/g, ""))} className="input w-32 py-2" placeholder="0" />
            </div>
            <div>
              <label className="label" htmlFor="f-max">Precio máx. (€)</label>
              <input id="f-max" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value.replace(/[^0-9.,]/g, ""))} className="input w-32 py-2" placeholder="1000" />
            </div>
            <button className="btn-primary py-2.5">Aplicar</button>
            {showOnSale && (
              <label className="ml-1 flex cursor-pointer items-center gap-2 py-2.5 text-sm">
                <input type="checkbox" checked={!!current.onSale} onChange={(e) => update({ ofertas: e.target.checked ? "1" : null })} className="h-4 w-4 accent-ink-900" />
                Solo ofertas
              </label>
            )}
          </form>
          {activeCount > 0 && (
            <button
              onClick={() => {
                setMin("");
                setMax("");
                update({ categoria: null, min: null, max: null, ofertas: null });
              }}
              className="btn-ghost justify-self-start"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
        active ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-600 hover:border-ink-900 hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}
