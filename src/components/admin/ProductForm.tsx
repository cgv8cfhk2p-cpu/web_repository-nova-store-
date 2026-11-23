"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { ActionForm, SubmitButton } from "./ActionForm";
import { saveProduct } from "@/app/admin/_actions/products";

type Img = { id: string; url: string };
type Category = { id: string; name: string };
export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  categoryId: string;
  description: string;
  price: string;
  compareAt: string;
  stock: number;
  weightGrams: string;
  active: boolean;
  featured: boolean;
  isDemo: boolean;
  images: Img[];
};

export function ProductForm({ values, categories }: { values: ProductFormValues; categories: Category[] }) {
  const [images, setImages] = useState<Img[]>(values.images);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setImages(values.images), [values.images]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const move = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <ActionForm
      action={saveProduct}
      className="grid gap-6 xl:grid-cols-3"
      onSuccess={() => {
        setPreviews([]);
        if (fileRef.current) fileRef.current.value = "";
      }}
    >
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="keepImages" value={JSON.stringify(images.map((i) => i.id))} />

      <div className="space-y-6 xl:col-span-2">
        <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <div className="grid gap-4">
            <label className="block"><span className="label">Nombre *</span>
              <input name="name" defaultValue={values.name} required maxLength={160} className="input" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="label">Marca</span>
                <input name="brand" defaultValue={values.brand} maxLength={80} className="input" />
              </label>
              <label className="block"><span className="label">Categoría *</span>
                <select name="categoryId" defaultValue={values.categoryId} required className="input">
                  <option value="">Selecciona…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
            <label className="block"><span className="label">Descripción *</span>
              <textarea name="description" defaultValue={values.description} required rows={8} maxLength={8000} className="input" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold">Fotografías</h2>
          <p className="mb-4 text-xs text-ink-500">JPG, PNG, WEBP o AVIF · máx. 5 MB cada una · hasta 10. La primera es la portada.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((img, i) => (
              <div key={img.id} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="badge absolute left-1.5 top-1.5 bg-ink-900 text-white">Portada</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-1.5">
                  <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1" aria-label="Mover a la izquierda"><ArrowLeft className="h-3 w-3" /></button>
                  <button type="button" onClick={() => setImages((p) => p.filter((x) => x.id !== img.id))} className="rounded bg-white/90 p-1 text-rose-700" aria-label="Quitar imagen"><X className="h-3 w-3" /></button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1" aria-label="Mover a la derecha"><ArrowRight className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
            {previews.map((p) => (
              <div key={p.url} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-100 ring-2 ring-dashed ring-ink-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover opacity-80" />
                <span className="badge absolute left-1.5 top-1.5 bg-white text-ink-900">Nueva</span>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 text-xs text-ink-500 transition hover:border-ink-900 hover:text-ink-900">
              <ImagePlus className="h-6 w-6" strokeWidth={1.5} /> Subir fotos
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            name="newImages"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => ({ name: f.name, url: URL.createObjectURL(f) })))}
          />
          {previews.length > 0 && <p className="mt-3 text-xs text-ink-500">Las fotos nuevas se subirán al guardar.</p>}
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Precio y existencias</h2>
          <div className="grid gap-4">
            <label className="block"><span className="label">Precio (€) *</span>
              <input name="price" defaultValue={values.price} required inputMode="decimal" placeholder="49,90" className="input" />
            </label>
            <label className="block"><span className="label">Precio anterior (€) — para ofertas</span>
              <input name="compareAt" defaultValue={values.compareAt} inputMode="decimal" placeholder="Opcional" className="input" />
            </label>
            <label className="block"><span className="label">Existencias *</span>
              <input name="stock" type="number" min={0} defaultValue={values.stock} required className="input" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="label">SKU</span>
                <input name="sku" defaultValue={values.sku} maxLength={60} className="input" />
              </label>
              <label className="block"><span className="label">Peso (g)</span>
                <input name="weightGrams" type="number" min={0} defaultValue={values.weightGrams} className="input" />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold">Visibilidad</h2>
          <div className="space-y-3 text-sm">
            <Toggle name="active" label="Activo (visible y a la venta)" defaultChecked={values.active} />
            <Toggle name="featured" label="Destacado en la portada" defaultChecked={values.featured} />
            <Toggle name="isDemo" label="Producto de demostración" defaultChecked={values.isDemo} />
          </div>
          <label className="mt-5 block"><span className="label">URL (slug)</span>
            <div className="flex items-center rounded-xl border border-ink-200 pl-3 text-sm text-ink-400 focus-within:border-ink-900">
              /producto/<input name="slug" defaultValue={values.slug} maxLength={90} placeholder="se genera del nombre" className="w-full bg-transparent py-3 pr-3 text-ink-900 outline-none" />
            </div>
          </label>
        </section>

        <SubmitButton className="btn-primary w-full py-3.5">{values.id ? "Guardar cambios" : "Crear producto"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-ink-300 transition peer-checked:bg-ink-900 peer-focus-visible:ring-2 peer-focus-visible:ring-ink-900 peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
