import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { countryName } from "@/lib/countries";
import { InfoPage } from "@/components/shop/InfoPage";

export const metadata: Metadata = { title: "Envíos y entregas" };
export const revalidate = 300;

export default async function ShippingPage() {
  const rates = await prisma.shippingRate.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <InfoPage eyebrow="Ayuda" title="Envíos y entregas">
      <p>Preparamos los pedidos en 24-48 horas laborables desde la confirmación del pago. Recibirás el número de seguimiento por correo electrónico en cuanto tu pedido salga del almacén.</p>
      <h2>Tarifas y plazos</h2>
      <div className="not-prose overflow-x-auto rounded-2xl border border-ink-200">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3 font-medium">Destino</th><th className="px-4 py-3 font-medium">Plazo</th><th className="px-4 py-3 font-medium">Precio</th><th className="px-4 py-3 font-medium">Gratis desde</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rates.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3"><span className="font-medium text-ink-900">{r.name}</span><br /><span className="text-xs text-ink-400">{r.countries.split(",").map((c) => countryName(c.trim())).join(", ")}</span></td>
                <td className="px-4 py-3">{r.estimatedDaysMin}-{r.estimatedDaysMax} días laborables</td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(r.priceCents)}</td>
                <td className="px-4 py-3 tabular-nums">{r.freeOverCents != null ? formatPrice(r.freeOverCents) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Los gastos de envío se muestran siempre en el carrito antes de pagar, en función del país de destino.</p>
      <h2>Transportistas</h2>
      <p>Trabajamos con Correos, GLS y DHL según destino y tamaño del paquete.</p>
      <h2>Incidencias</h2>
      <p>Si tu pedido llega dañado o incompleto, escríbenos en un plazo de 48 horas desde la entrega a través de la página de <a href="/contacto">contacto</a>, indicando tu número de pedido y fotografías del paquete.</p>
    </InfoPage>
  );
}
