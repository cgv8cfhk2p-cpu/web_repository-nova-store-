"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePriceToCents } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { deleteImage, saveImage, UploadError } from "@/lib/storage";
import type { ActionState } from "@/components/admin/ActionForm";

const MAX_IMAGES = 10;

const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(160),
  slug: z.string().trim().max(90).optional(),
  brand: z.string().trim().max(80).optional(),
  sku: z.string().trim().max(60).optional(),
  categoryId: z.string().min(1, "Elige una categoría"),
  description: z.string().trim().min(10, "La descripción debe tener al menos 10 caracteres").max(8000),
  price: z.string(),
  compareAt: z.string().optional(),
  stock: z.coerce.number().int("Las existencias deben ser un número entero").min(0).max(1_000_000),
  weightGrams: z.string().optional(),
});

function revalidateShop(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/producto/${slug}`);
}

export async function saveProduct(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = (fd.get("id") as string) || null;
  const parsed = productSchema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug") || undefined,
    brand: fd.get("brand") || undefined,
    sku: fd.get("sku") || undefined,
    categoryId: fd.get("categoryId"),
    description: fd.get("description"),
    price: fd.get("price"),
    compareAt: fd.get("compareAt") || undefined,
    stock: fd.get("stock") || 0,
    weightGrams: fd.get("weightGrams") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const priceCents = parsePriceToCents(d.price);
  if (priceCents == null || priceCents < 50) return { error: "Precio no válido (mínimo 0,50 €). Ejemplo: 49,90" };
  const compareAtCents = d.compareAt ? parsePriceToCents(d.compareAt) : null;
  if (d.compareAt && compareAtCents == null) return { error: "Precio anterior no válido." };
  if (compareAtCents != null && compareAtCents <= priceCents) return { error: "El precio anterior debe ser mayor que el precio actual para mostrarse como oferta." };
  const weightGrams = d.weightGrams ? parseInt(d.weightGrams, 10) : null;
  if (weightGrams != null && (!Number.isFinite(weightGrams) || weightGrams < 0)) return { error: "Peso no válido." };

  const slug = slugify(d.slug || d.name);
  if (!slug) return { error: "No se ha podido generar la URL del producto." };

  // Imágenes: existentes (en el orden indicado) + nuevas subidas
  let keep: string[] = [];
  try {
    keep = JSON.parse((fd.get("keepImages") as string) || "[]");
    if (!Array.isArray(keep)) keep = [];
  } catch {}
  const files = fd.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  if (keep.length + files.length > MAX_IMAGES) return { error: `Máximo ${MAX_IMAGES} imágenes por producto.` };

  const uploaded: string[] = [];
  try {
    for (const f of files) uploaded.push(await saveImage(f, "products"));
  } catch (e) {
    for (const u of uploaded) await deleteImage(u);
    return { error: e instanceof UploadError ? e.message : "Error al subir las imágenes." };
  }

  const data = {
    name: d.name,
    slug,
    brand: d.brand || null,
    sku: d.sku || null,
    categoryId: d.categoryId,
    description: d.description,
    priceCents,
    compareAtCents,
    stock: d.stock,
    weightGrams,
    active: fd.get("active") === "on",
    featured: fd.get("featured") === "on",
    isDemo: fd.get("isDemo") === "on",
  };

  let productId = id;
  let removedUrls: string[] = [];
  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        const existing = await tx.productImage.findMany({ where: { productId: id } });
        const toRemove = existing.filter((img) => !keep.includes(img.id));
        removedUrls = toRemove.map((r) => r.url);
        await tx.productImage.deleteMany({ where: { id: { in: toRemove.map((r) => r.id) } } });
        await tx.product.update({ where: { id }, data });
        for (const [pos, imgId] of keep.entries()) {
          await tx.productImage.updateMany({ where: { id: imgId, productId: id }, data: { position: pos } });
        }
      } else {
        const created = await tx.product.create({ data });
        productId = created.id;
      }
      if (uploaded.length) {
        await tx.productImage.createMany({
          data: uploaded.map((url, i) => ({ url, productId: productId!, alt: d.name, position: keep.length + i })),
        });
      }
    });
  } catch (e) {
    for (const u of uploaded) await deleteImage(u);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = String((e.meta?.target as string[] | undefined)?.join(",") ?? "");
      return { error: target.includes("sku") ? "Ya existe un producto con ese SKU." : "Ya existe un producto con esa URL (slug). Cambia el nombre o el slug." };
    }
    throw e;
  }
  for (const u of removedUrls) await deleteImage(u);

  revalidateShop(slug);
  revalidatePath("/admin/productos");
  if (!id) redirect(`/admin/productos/${productId}?creado=1`);
  return { ok: "Producto guardado.", ts: Date.now() };
}

export async function toggleProduct(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const field = fd.get("field") === "featured" ? "featured" : "active";
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { [field]: !p[field] } });
  revalidateShop(p.slug);
  revalidatePath("/admin/productos");
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const p = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!p) redirect("/admin/productos");
  await prisma.product.delete({ where: { id } }); // los pedidos conservan su copia del nombre y precio
  for (const img of p.images) await deleteImage(img.url);
  revalidateShop(p.slug);
  redirect("/admin/productos?eliminado=1");
}

export async function deleteDemoContent() {
  await requireAdmin();
  const demos = await prisma.product.findMany({ where: { isDemo: true }, select: { id: true } });
  await prisma.product.deleteMany({ where: { isDemo: true } });
  revalidateShop();
  redirect(`/admin/productos?demos=${demos.length}`);
}
