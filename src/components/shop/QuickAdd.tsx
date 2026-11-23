"use client";

import { Plus } from "lucide-react";
import { useCart, type CartItem } from "./CartProvider";

export function QuickAdd({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { add } = useCart();
  if (product.stock <= 0) return null;
  return (
    <button
      type="button"
      onClick={() => add(product)}
      aria-label={`Añadir ${product.name} al carrito`}
      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-900 shadow-sm transition-all duration-300 hover:bg-ink-900 hover:text-white sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}
