"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/money";
import { ProductImage } from "@/components/ui/ProductImage";
import { DemoBadge } from "@/components/ui/DemoBadge";

export function CartDrawer() {
  const { items, open, setOpen, setQuantity, remove, subtotalCents, count } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Tu carrito ({count})</h2>
          <button aria-label="Cerrar carrito" onClick={() => setOpen(false)} className="-mr-2 p-2 text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-ink-300" strokeWidth={1.2} />
            <p className="text-ink-500">Tu carrito está vacío.</p>
            <Link href="/tienda" onClick={() => setOpen(false)} className="btn-primary">Descubrir productos</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.productId} className="flex gap-4 py-5">
                  <Link href={`/producto/${i.slug}`} onClick={() => setOpen(false)} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <ProductImage src={i.imageUrl} alt={i.name} sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {i.brand && <p className="text-[11px] uppercase tracking-wider text-ink-500">{i.brand}</p>}
                        <Link href={`/producto/${i.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-medium">{i.name}</Link>
                        {i.isDemo && <DemoBadge className="mt-1" />}
                      </div>
                      <button onClick={() => remove(i.productId)} aria-label={`Eliminar ${i.name}`} className="p-1 text-ink-400 hover:text-ink-900">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyControl value={i.quantity} max={Math.min(20, i.stock)} onChange={(q) => setQuantity(i.productId, q)} />
                      <span className="text-sm font-semibold tabular-nums">{formatPrice(i.priceCents * i.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t border-ink-100 px-6 py-6">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPrice(subtotalCents)}</span>
              </div>
              <p className="text-xs text-ink-500">Los gastos de envío se calculan en el carrito según tu país, antes de pagar.</p>
              <Link href="/carrito" onClick={() => setOpen(false)} className="btn-primary w-full">Ver carrito y envío</Link>
              <button onClick={() => setOpen(false)} className="btn-ghost w-full">Seguir comprando</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function QtyControl({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200">
      <button type="button" aria-label="Restar una unidad" onClick={() => onChange(value - 1)} className="p-2 text-ink-500 hover:text-ink-900 disabled:opacity-30" disabled={value <= 1}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Sumar una unidad" onClick={() => onChange(value + 1)} className="p-2 text-ink-500 hover:text-ink-900 disabled:opacity-30" disabled={value >= max}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
