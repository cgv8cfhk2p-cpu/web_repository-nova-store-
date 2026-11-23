"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";

export type QuoteResponse = {
  lines: { productId: string; name: string; unitPriceCents: number; quantity: number; lineTotalCents: number; stock: number }[];
  issues: string[];
  removed: string[];
  subtotalCents: number;
  shipping: { name: string; priceCents: number; baseCents: number; freeOverCents: number | null; estimatedDaysMin: number; estimatedDaysMax: number } | null;
  totalCents: number;
  country?: string;
  availableCountries?: { code: string; name: string }[];
};

/** Pide al servidor el cálculo real del carrito (precios, stock y envío). */
export function useQuote(country: string) {
  const { items, ready, sync } = useCart();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);
  const key = JSON.stringify(items.map((i) => [i.productId, i.quantity]));

  useEffect(() => {
    if (!ready) return;
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), country }),
        });
        if (!res.ok) throw new Error();
        const data: QuoteResponse = await res.json();
        if (id !== reqId.current) return;
        setQuote(data);
        setError(null);
        if (data.lines.length || data.removed.length) sync(data.lines, data.removed);
      } catch {
        if (id === reqId.current) setError("No se ha podido calcular el total. Revisa tu conexión.");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, country, ready]);

  return { quote, loading, error, setQuote };
}
