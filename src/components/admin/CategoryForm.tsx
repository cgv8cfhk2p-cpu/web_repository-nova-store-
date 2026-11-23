"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "./ActionForm";
import { saveCategory } from "@/app/admin/_actions/categories";

type Values = { id?: string; name: string; slug: string; description: string; sortOrder: number; active: boolean; imageUrl: string | null };

export function CategoryForm({ values }: { values: Values }) {
  const [preview, setPreview] = useState<string | null>(values.imageUrl);
  return (
    <ActionForm action={saveCategory} className="grid gap-4" resetOnSuccess={!values.id}>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Nombre *</span><input name="name" defaultValue={values.name} required maxLength={80} className="input" /></label>
        <label className="block"><span className="label">URL (slug)</span><input name="slug" defaultValue={values.slug} maxLength={80} placeholder="se genera del nombre" className="input" /></label>
      </div>
      <label className="block"><span className="label">Descripción</span><textarea name="description" defaultValue={values.description} rows={3} maxLength={500} className="input" /></label>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block"><span className="label">Fotografía (JPG, PNG, WEBP · máx. 5 MB)</span>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="input py-2 file:mr-3 file:rounded-full file:border-0 file:bg-ink-900 file:px-3 file:py-1 file:text-xs file:text-white"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
        </label>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="" className="h-24 w-20 rounded-lg bg-ink-100 object-cover" />}
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <label className="block"><span className="label">Orden</span><input name="sortOrder" type="number" min={0} defaultValue={values.sortOrder} className="input w-28" /></label>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" name="active" defaultChecked={values.active} className="h-4 w-4 accent-ink-900" /> Activa (visible en la tienda)</label>
      </div>
      <div><SubmitButton className="btn-primary py-2.5">{values.id ? "Guardar cambios" : "Crear categoría"}</SubmitButton></div>
    </ActionForm>
  );
}
