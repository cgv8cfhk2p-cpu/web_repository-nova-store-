import { prisma } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { COUNTRIES } from "@/lib/countries";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteShippingRate, saveShippingRate } from "@/app/admin/_actions/shipping";
import { carriers } from "@/lib/carriers";

export const metadata = { title: "Tarifas de envío" };

type Rate = { id?: string; name: string; countries: string; price: string; freeOver: string; daysMin: number; daysMax: number; sortOrder: number; active: boolean };

function RateForm({ r }: { r: Rate }) {
  return (
    <ActionForm action={saveShippingRate} className="grid gap-3">
      {r.id && <input type="hidden" name="id" value={r.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="label">Nombre visible</span><input name="name" defaultValue={r.name} className="input py-2.5" required /></label>
        <label className="block"><span className="label">Países (códigos ISO separados por comas)</span><input name="countries" defaultValue={r.countries} className="input py-2.5 uppercase" required placeholder="ES,PT" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <label className="block"><span className="label">Precio (€)</span><input name="price" defaultValue={r.price} inputMode="decimal" className="input py-2.5" required /></label>
        <label className="block"><span className="label">Gratis desde (€)</span><input name="freeOver" defaultValue={r.freeOver} inputMode="decimal" className="input py-2.5" placeholder="—" /></label>
        <label className="block"><span className="label">Días mín.</span><input name="daysMin" type="number" min={0} defaultValue={r.daysMin} className="input py-2.5" /></label>
        <label className="block"><span className="label">Días máx.</span><input name="daysMax" type="number" min={0} defaultValue={r.daysMax} className="input py-2.5" /></label>
        <label className="block"><span className="label">Orden</span><input name="sortOrder" type="number" min={0} defaultValue={r.sortOrder} className="input py-2.5" /></label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={r.active} className="h-4 w-4 accent-ink-900" /> Activa</label>
        <SubmitButton className="btn-primary py-2">{r.id ? "Guardar" : "Añadir tarifa"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function ShippingRatesPage() {
  const rates = await prisma.shippingRate.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Tarifas de envío" description="El cliente ve el coste de envío en el carrito antes de pagar. Si un país tiene varias tarifas, se aplica la más barata." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {rates.map((r) => (
            <Panel key={r.id} title={r.name} actions={
              <form action={deleteShippingRate}>
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton message="¿Eliminar esta tarifa?" className="text-xs text-rose-700 hover:underline">Eliminar</ConfirmButton>
              </form>
            }>
              <RateForm r={{ id: r.id, name: r.name, countries: r.countries, price: centsToInput(r.priceCents), freeOver: centsToInput(r.freeOverCents), daysMin: r.estimatedDaysMin, daysMax: r.estimatedDaysMax, sortOrder: r.sortOrder, active: r.active }} />
            </Panel>
          ))}
          <Panel title="Nueva tarifa">
            <RateForm r={{ name: "", countries: "", price: "", freeOver: "", daysMin: 2, daysMax: 5, sortOrder: rates.length, active: true }} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Códigos de país">
            <ul className="grid grid-cols-2 gap-1 text-xs text-ink-600">
              {Object.entries(COUNTRIES).map(([k, v]) => <li key={k}><span className="font-mono font-semibold">{k}</span> {v}</li>)}
            </ul>
          </Panel>
          <Panel title="Integraciones de transportistas">
            <ul className="space-y-2 text-sm">
              {Object.values(carriers).map((c) => (
                <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className={c.isConfigured() ? "text-emerald-700" : "text-ink-400"}>{c.isConfigured() ? "Configurado" : "Pendiente"}</span></li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-500">Para generar etiquetas automáticamente, añade las credenciales del transportista en las variables de entorno (ver README).</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
