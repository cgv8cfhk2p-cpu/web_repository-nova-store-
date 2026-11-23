import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const PAGE_SIZE = 24;

export const SORTS = {
  recientes: { label: "Novedades", orderBy: [{ createdAt: "desc" }] },
  "precio-asc": { label: "Precio: menor a mayor", orderBy: [{ priceCents: "asc" }] },
  "precio-desc": { label: "Precio: mayor a menor", orderBy: [{ priceCents: "desc" }] },
  nombre: { label: "Nombre (A-Z)", orderBy: [{ name: "asc" }] },
} satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }>;

export type SortKey = keyof typeof SORTS;

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  priceCents: true,
  compareAtCents: true,
  stock: true,
  isDemo: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 2 },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

const visible: Prisma.ProductWhereInput = { active: true, category: { active: true } };

export type CatalogParams = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  sort?: string;
  page?: number;
  onSale?: boolean;
  brand?: string;
};

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogParams {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const num = (k: string) => {
    const v = get(k);
    if (!v) return undefined;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  return {
    q: get("q")?.slice(0, 80).trim() || undefined,
    category: get("categoria") || undefined,
    min: num("min"),
    max: num("max"),
    sort: get("orden") || undefined,
    page: Math.max(1, Math.floor(num("pagina") ?? 1)),
    onSale: get("ofertas") === "1",
    brand: get("marca")?.slice(0, 60) || undefined,
  };
}

export async function searchProducts(p: CatalogParams) {
  const where: Prisma.ProductWhereInput = { ...visible, AND: [] };
  const and = where.AND as Prisma.ProductWhereInput[];
  if (p.q) {
    const terms = p.q.split(/\s+/).filter(Boolean).slice(0, 5);
    for (const t of terms) {
      and.push({
        OR: [
          { name: { contains: t, mode: "insensitive" } },
          { brand: { contains: t, mode: "insensitive" } },
          { description: { contains: t, mode: "insensitive" } },
          { category: { name: { contains: t, mode: "insensitive" } } },
        ],
      });
    }
  }
  if (p.category) and.push({ category: { slug: p.category } });
  if (p.brand) and.push({ brand: { equals: p.brand, mode: "insensitive" } });
  if (p.min != null) and.push({ priceCents: { gte: Math.round(p.min * 100) } });
  if (p.max != null) and.push({ priceCents: { lte: Math.round(p.max * 100) } });
  if (p.onSale) and.push({ compareAtCents: { gt: prisma.product.fields.priceCents } });

  const sort = (p.sort && p.sort in SORTS ? p.sort : "recientes") as SortKey;
  const page = p.page ?? 1;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: [...SORTS[sort].orderBy, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { products, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), sort };
}

export function getFeatured(take = 8) {
  return prisma.product.findMany({
    where: { ...visible, featured: true },
    select: productCardSelect,
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export function getNewArrivals(take = 8) {
  return prisma.product.findMany({ where: visible, select: productCardSelect, orderBy: { createdAt: "desc" }, take });
}

export function getOnSale(take = 8) {
  return prisma.product.findMany({
    where: { ...visible, compareAtCents: { gt: prisma.product.fields.priceCents } },
    select: productCardSelect,
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export function getCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, ...visible },
    include: { images: { orderBy: { position: "asc" } }, category: true },
  });
}

export function getRelated(productId: string, categoryId: string, take = 4) {
  return prisma.product.findMany({
    where: { ...visible, categoryId, id: { not: productId } },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}
