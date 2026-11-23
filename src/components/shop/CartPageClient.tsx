"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, Lock, ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { QtyControl } from "./CartDrawer";
import { useQuote } from "./useQuote";
import { OrderSummary } from "./OrderSummary";
import { ProductImage } from "@/components/ui/ProductImage";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { formatPrice } from "@/lib/money";

export function CartPageClient() {
  const { items, ready, setQuantity, remove } = useCart();
  const [country, setCountry] = useState("ES");
  const { quote, loading, error } = useQuote(country);

  if (!ready) return <div className="container-ns min-h-[50vh] py-16" />;

  if (items.length === 0) {
    return (
      <div className="container-ns flex min-h-[55vh] flex-col items-center justify-center gap-5 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-ink-300" strokeWidth={1.2} />
        <h1 className="text-3xl font-light">Tu carrito está vacío</h1>
        <p className="text-ink-500">Descubre nuestras categorías y encuentra lo que buscas.</p>
        <Link href="/tienda" className="btn-primary">Ir a la tienda</Link>
      </div>
    );
  }

  const canCheckout = !!quote && quote.lines.length > 0 && !!quote.shipping && !loading;

  return (
    <div className="container-ns py-10 sm:py-16">
      <h1 className="mb-10 text-4xl font-light tracking-tight">Carrito</h1>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {quote && quote.issues.length > 0 && (
            <div className="mb-6 space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              {quote.issues.map((i) => (
                <p key={i} className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {i}</p>
              ))}
            </div>
          )}
          <ul className="divide-y divide-ink-100 border-y border-ink-100">
            {items.map((i) => (
              <li key={i.productId} className="flex gap-4 py-6 sm:gap-6">
                <Link href={`/producto/${i.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:h-36 sm:w-28">
                  <ProductImage src={i.imageUrl} alt={i.name} sizes="112px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      {i.brand && <p className="text-[11px] uppercase tracking-wider text-ink-500">{i.brand}</p>}
                      <Link href={`/producto/${i.slug}`} className="font-medium">{i.name}</Link>
                      <p className="mt-1 text-sm text-ink-500">{formatPrice(i.priceCents)} / ud.</p>
                      {i.isDemo && <DemoBadge className="mt-2" />}
                    </div>
                    <button onClick={() => remove(i.productId)} aria-label={`Eliminar ${i.name}`} className="h-fit p-1 text-ink-400 hover:text-ink-900">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QtyControl value={i.quantity} max={Math.min(20, i.stock)} onChange={(q) => setQuantity(i.productId, q)} />
                    <span className="font-semibold tabular-nums">{formatPrice(i.priceCents * i.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/tienda" className="btn-ghost mt-4 -ml-3">← Seguir comprando</Link>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <OrderSummary quote={quote} loading={loading}>
              <div className="mt-6">
                <label htmlFor="ship-country" className="label">País de envío</label>
                <select id="ship-country" value={country} onChange={(e) => setCountry(e.target.value)} className="input">
                  {(quote?.availableCountries ?? [{ code: "ES", name: "España" }]).map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
              <Link
                href={`/checkout?pais=${country}`}
                aria-disabled={!canCheckout}
                className={`btn-primary mt-6 w-full py-4 ${canCheckout ? "" : "pointer-events-none opacity-50"}`}
              >
                Tramitar pedido <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
                <Lock className="h-3.5 w-3.5" /> Pago seguro con Stripe · Tarjeta, Apple Pay, Google Pay
              </p>
            </OrderSummary>
          </div>
        </div>
      </div>
    </div>
  );
}
