import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { store } from "@/config/store";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { active: true, isDemo: false }, select: { slug: true, updatedAt: true }, take: 5000 }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const base = store.siteUrl;
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tienda`, changeFrequency: "daily" },
    { url: `${base}/ofertas`, changeFrequency: "daily" },
    ...categories.map((c) => ({ url: `${base}/categoria/${c.slug}`, lastModified: c.updatedAt })),
    ...products.map((p) => ({ url: `${base}/producto/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
