"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { deleteImage, saveImage, UploadError } from "@/lib/storage";
import type { ActionState } from "@/components/admin/ActionForm";

const schema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function saveCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = (fd.get("id") as string) || null;
  const parsed = schema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug") || undefined,
    description: fd.get("description") || undefined,
    sortOrder: fd.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const slug = slugify(parsed.data.slug || parsed.data.name);

  const file = fd.get("image");
  let imageUrl: string | undefined;
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveImage(file, "categories");
    } catch (e) {
      return { error: e instanceof UploadError ? e.message : "Error al subir la imagen." };
    }
  }
  const data = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    sortOrder: parsed.data.sortOrder,
    active: fd.get("active") === "on",
    ...(imageUrl ? { imageUrl } : {}),
  };
  try {
    if (id) {
      const prev = await prisma.category.findUnique({ where: { id } });
      await prisma.category.update({ where: { id }, data });
      if (imageUrl && prev?.imageUrl) await deleteImage(prev.imageUrl);
    } else {
      await prisma.category.create({ data });
    }
  } catch (e) {
    if (imageUrl) await deleteImage(imageUrl);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Ya existe una categoría con esa URL." };
    throw e;
  }
  revalidatePath("/", "layout");
  if (!id) redirect("/admin/categorias?creada=1");
  return { ok: "Categoría guardada.", ts: Date.now() };
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) redirect(`/admin/categorias/${id}?error=productos`);
  const c = await prisma.category.delete({ where: { id } });
  if (c.imageUrl) await deleteImage(c.imageUrl);
  revalidatePath("/", "layout");
  redirect("/admin/categorias?eliminada=1");
}
