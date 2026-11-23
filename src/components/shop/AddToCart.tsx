"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "./CartProvider";
import { QtyControl } from "./CartDrawer";

export function AddToCart({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.min(20, product.stock);

  if (product.stock <= 0) {
    return <button disabled className="btn-primary w-full py-4">Agotado</button>;
  }
  return (
    <div className="flex gap-3">
      <QtyControl value={qty} max={max} onChange={(v) => setQty(Math.max(1, Math.min(max, v)))} />
      <button
        className="btn-primary flex-1 py-4"
        onClick={() => {
          add(product, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1800);
        }}
      >
        {added ? <><Check className="h-4 w-4" /> Añadido</> : <><ShoppingBag className="h-4 w-4" /> Añadir al carrito</>}
      </button>
    </div>
  );
}
