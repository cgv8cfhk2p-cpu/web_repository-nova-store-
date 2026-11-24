"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCart, type CartItem } from "./CartProvider";
import { QtyControl } from "./CartDrawer";

export function AddToCart({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Barra de compra fija en móvil: aparece cuando el botón principal no está en pantalla
  // (en móvil la galería ocupa toda la primera pantalla y el botón queda escondido).
  const mainRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const max = Math.min(20, product.stock);

  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (product.stock <= 0) {
    return <button disabled className="btn-primary w-full py-4">Agotado</button>;
  }

  const handleAdd = () => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const label = added ? <><Check className="h-4 w-4" /> Añadido</> : <><ShoppingBag className="h-4 w-4" /> Añadir al carrito</>;

  return (
    <>
      <div ref={mainRef} className="flex gap-3">
        <QtyControl value={qty} max={max} onChange={(v) => setQty(Math.max(1, Math.min(max, v)))} />
        <button className="btn-primary flex-1 py-4" onClick={handleAdd}>{label}</button>
      </div>

      <div
        aria-hidden={!showSticky}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300 lg:hidden ${
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs text-ink-500">{product.name}</p>
            <p className="text-base font-semibold tabular-nums">{formatPrice(product.priceCents)}</p>
          </div>
          <button className="btn-primary px-5 py-3.5" onClick={handleAdd} tabIndex={showSticky ? 0 : -1}>{label}</button>
        </div>
      </div>
    </>
  );
}
