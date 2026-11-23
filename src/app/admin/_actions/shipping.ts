"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePriceToCents } from "@/lib/money";
import { COUNTRIES } from "@/lib/countries";
import type { ActionState } from "@/components/admin/ActionForm";

export async function saveShippingRate(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.string().optional(),
      name: z.string().trim().min(3, "Nombre obligatorio").max(100),
      countries: z.string().trim().min(2, "Indica al menos un país"),
      price: z.string(),
      freeOver: z.string().optional(),
      daysMin: z.coerce.number().int().min(0).max(60),
      daysMax: z.coerce.number().int().min(0).max(60),
      sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const codes = [...new Set(d.countries.toUpperCase().split(/[\s,;]+/).filter(Boolean))];
  const invalid = codes.filter((c) => !(c in COUNTRIES));
  if (invalid.length) return { error: `Códigos de país no válidos: ${invalid.join(", ")}` };
  const priceCents = parsePriceToCents(d.price);
  if (priceCents == null) return { error: "Precio de envío no válido." };
  const freeOverCents = d.freeOver ? parsePriceToCents(d.freeOver) : null;
  if (d.freeOver && freeOverCents == null) return { error: "Importe de envío gratis no válido." };
  if (d.daysMax < d.daysMin) return { error: "El plazo máximo debe ser mayor o igual que el mínimo." };

  const data = {
    name: d.name,
    countries: codes.join(","),
    priceCents,
    freeOverCents,
    estimatedDaysMin: d.daysMin,
    estimatedDaysMax: d.daysMax,
    sortOrder: d.sortOrder,
    active: fd.get("active") === "on",
  };
  if (d.id) await prisma.shippingRate.update({ where: { id: d.id }, data });
  else await prisma.shippingRate.create({ data });
  revalidatePath("/admin/envios");
  revalidatePath("/", "layout");
  return { ok: "Tarifa guardada.", ts: Date.now() };
}

export async function deleteShippingRate(fd: FormData) {
  await requireAdmin();
  await prisma.shippingRate.delete({ where: { id: String(fd.get("id")) } });
  revalidatePath("/admin/envios");
  revalidatePath("/", "layout");
}
