"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { useCart } from "./CartProvider";
import { useQuote } from "./useQuote";
import { OrderSummary } from "./OrderSummary";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPrice } from "@/lib/money";

type Fields = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
  address1: string;
  address2: string;
  website: string; // trampa anti-bots (oculto)
};

export function CheckoutForm({ initialCountry, provinces }: { initialCountry: string; provinces: string[] }) {
  const { items, ready } = useCart();
  const [f, setF] = useState<Fields>({
    fullName: "", email: "", phone: "", country: initialCountry, province: "", city: "", postalCode: "", address1: "", address2: "", website: "",
  });
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { quote, loading } = useQuote(f.country);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((prev) => ({ ...prev, [k]: e.target.value, ...(k === "country" ? { province: "" } : {}) }));
    setErrors((prev) => ({ ...prev, [`shipping.${k}`]: "" }));
  };

  if (ready && items.length === 0) {
    return (
      <div className="container-ns flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="text-3xl font-light">No hay productos en tu carrito</h1>
        <Link href="/tienda" className="btn-primary">Ir a la tienda</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!accept) {
      setErrors((p) => ({ ...p, acceptTerms: "Debes aceptar las condiciones de compra" }));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shipping: f,
          acceptTerms: accept,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.assign(data.url); // Redirección a Stripe Checkout
        return;
      }
      setErrors(data.fields ?? {});
      setFormError(data.issues?.length ? `${data.error} ${data.issues.join(" ")}` : data.error ?? "No se ha podido procesar el pedido.");
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  const err = (k: keyof Fields) => errors[`shipping.${k}`];
  const countries = quote?.availableCountries ?? [{ code: initialCountry, name: initialCountry }];

  return (
    <div className="container-ns py-10 sm:py-16">
      <h1 className="mb-2 text-4xl font-light tracking-tight">Finalizar compra</h1>
      <p className="mb-10 text-sm text-ink-500">Introduce tus datos de envío. El pago se realiza en la plataforma segura de Stripe.</p>

      <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          {formError && (
            <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <fieldset className="space-y-4">
            <legend className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">Contacto</legend>
            <Field label="Nombre y apellidos" error={err("fullName")}>
              <input className="input" autoComplete="name" value={f.fullName} onChange={set("fullName")} required maxLength={120} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Correo electrónico" error={err("email")}>
                <input className="input" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} required maxLength={160} />
              </Field>
              <Field label="Teléfono" error={err("phone")}>
                <input className="input" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set("phone")} required maxLength={20} placeholder="+34 600 000 000" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">Dirección de envío</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="País" error={err("country")}>
                <select className="input" autoComplete="country" value={f.country} onChange={set("country")}>
                  {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Provincia" error={err("province")}>
                {f.country === "ES" ? (
                  <select className="input" autoComplete="address-level1" value={f.province} onChange={set("province")} required>
                    <option value="">Selecciona…</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input className="input" autoComplete="address-level1" value={f.province} onChange={set("province")} required maxLength={80} />
                )}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ciudad" error={err("city")}>
                <input className="input" autoComplete="address-level2" value={f.city} onChange={set("city")} required maxLength={80} />
              </Field>
              <Field label="Código postal" error={err("postalCode")}>
                <input className="input" autoComplete="postal-code" value={f.postalCode} onChange={set("postalCode")} required maxLength={10} inputMode={f.country === "ES" ? "numeric" : "text"} />
              </Field>
            </div>
            <Field label="Dirección completa" error={err("address1")}>
              <input className="input" autoComplete="address-line1" value={f.address1} onChange={set("address1")} required maxLength={160} placeholder="Calle, número" />
            </Field>
            <Field label="Piso, puerta, escalera (opcional)" error={err("address2")}>
              <input className="input" autoComplete="address-line2" value={f.address2} onChange={set("address2")} maxLength={160} />
            </Field>
            {/* Campo trampa: invisible para personas, los bots lo rellenan */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Web<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
            </div>
          </fieldset>
        </div>

        <div className="lg:col-span-5">
          <div className="space-y-6 lg:sticky lg:top-28">
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <ProductImage src={i.imageUrl} alt={i.name} sizes="56px" />
                    <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink-900 px-1 text-[10px] font-semibold text-white">{i.quantity}</span>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm">{i.name}</span>
                  <span className="text-sm tabular-nums">{formatPrice(i.priceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <OrderSummary quote={quote} loading={loading}>
              {quote && quote.issues.length > 0 && (
                <div className="mt-4 space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                  {quote.issues.map((i) => <p key={i}>{i}</p>)}
                </div>
              )}
              <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" checked={accept} onChange={(e) => { setAccept(e.target.checked); setErrors((p) => ({ ...p, acceptTerms: "" })); }} className="mt-0.5 h-4 w-4 accent-ink-900" />
                <span className="text-ink-600">
                  He leído y acepto las <Link href="/condiciones" target="_blank" className="underline underline-offset-2">condiciones de compra</Link> y la{" "}
                  <Link href="/privacidad" target="_blank" className="underline underline-offset-2">política de privacidad</Link>.
                </span>
              </label>
              {errors.acceptTerms && <p className="mt-1 text-xs text-rose-700">{errors.acceptTerms}</p>}
              <button disabled={submitting || loading || !quote?.shipping || !quote.lines.length} className="btn-primary mt-6 w-full py-4">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirigiendo a Stripe…</> : <><Lock className="h-4 w-4" /> Pagar {quote ? formatPrice(quote.totalCents) : ""}</>}
              </button>
              <p className="mt-4 text-center text-xs text-ink-500">
                Serás redirigido a Stripe para pagar con tarjeta, Apple Pay o Google Pay. NOVASTORE nunca ve ni guarda los datos de tu tarjeta.
              </p>
            </OrderSummary>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={`block ${error ? "[&_.input]:border-rose-400" : ""}`}>
        <span className="label">{label}</span>
        {children}
      </label>
      {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
