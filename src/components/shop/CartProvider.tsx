"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  brand?: string | null;
  priceCents: number; // solo para mostrar: el servidor recalcula siempre el precio real
  imageUrl: string | null;
  quantity: number;
  stock: number;
  isDemo: boolean;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  sync: (lines: { productId: string; unitPriceCents: number; quantity: number; stock: number; name: string }[], removed: string[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "novastore-cart-v1";
const MAX_QTY = 20;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && typeof i.productId === "string"));
      }
    } catch {}
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setItems(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      const limit = Math.min(MAX_QTY, item.stock);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, ...item, quantity: Math.min(limit, i.quantity + quantity) } : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(limit, quantity) }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(MAX_QTY, i.stock, quantity)) } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  // Actualiza precios/stock con los datos reales del servidor
  const sync = useCallback<CartContextValue["sync"]>((lines, removed) => {
    setItems((prev) => {
      let changed = false;
      const next = prev
        .filter((i) => {
          if (removed.includes(i.productId)) {
            changed = true;
            return false;
          }
          return true;
        })
        .map((i) => {
          const l = lines.find((x) => x.productId === i.productId);
          if (!l) return i;
          if (l.unitPriceCents !== i.priceCents || l.quantity !== i.quantity || l.stock !== i.stock || l.name !== i.name) {
            changed = true;
            return { ...i, priceCents: l.unitPriceCents, quantity: l.quantity, stock: l.stock, name: l.name };
          }
          return i;
        });
      return changed ? next : prev;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      open,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
      sync,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotalCents: items.reduce((s, i) => s + i.priceCents * i.quantity, 0),
    }),
    [items, ready, open, add, setQuantity, remove, clear, sync],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
