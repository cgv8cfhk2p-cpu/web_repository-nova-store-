"use client";

import { formatPrice } from "@/lib/money";
import type { QuoteResponse } from "./useQuote";

export function OrderSummary({ quote, loading, children }: { quote: QuoteResponse | null; loading: boolean; children?: React.ReactNode }) {
  const s = quote?.shipping;
  const missingForFree = s?.freeOverCents && s.priceCents > 0 && quote ? s.freeOverCents - quote.subtotalCents : null;
  return (
    <div className={`rounded-2xl bg-ink-50 p-6 transition-opacity sm:p-8 ${loading ? "opacity-60" : ""}`}>
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em]">Resumen del pedido</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Subtotal</dt>
          <dd className="tabular-nums">{quote ? formatPrice(quote.subtotalCents) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-500">
            Envío
            {s && <span className="block text-xs text-ink-400">{s.name} · {s.estimatedDaysMin}-{s.estimatedDaysMax} días laborables</span>}
          </dt>
          <dd className="tabular-nums">{s ? (s.priceCents === 0 ? <span className="font-medium text-emerald-700">Gratis</span> : formatPrice(s.priceCents)) : quote?.lines.length ? "No disponible" : "—"}</dd>
        </div>
        {missingForFree && missingForFree > 0 ? (
          <p className="rounded-lg bg-white px-3 py-2 text-xs text-ink-600">
            Añade {formatPrice(missingForFree)} más para disfrutar del <strong>envío gratis</strong>.
          </p>
        ) : null}
        <div className="flex justify-between border-t border-ink-200 pt-4 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{quote ? formatPrice(quote.totalCents) : "—"}</dd>
        </div>
        <p className="text-xs text-ink-400">IVA incluido</p>
      </dl>
      {children}
    </div>
  );
}
