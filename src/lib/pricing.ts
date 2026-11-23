import "server-only";
import { prisma } from "./db";
import { COUNTRIES } from "./countries";
import { demoCheckoutAllowed } from "./stripe";
import type { CartItemInput } from "./validation";

export type QuoteLine = {
  productId: string;
  name: string;
  slug: string;
  brand: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: number;
  isDemo: boolean;
};

export type ShippingQuote = {
  rateId: string;
  name: string;
  priceCents: number;
  baseCents: number;
  freeOverCents: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
};

export type Quote = {
  lines: QuoteLine[];
  issues: string[];
  removed: string[]; // productIds que ya no existen o están desactivados
  subtotalCents: number;
  shipping: ShippingQuote | null;
  totalCents: number;
  country: string;
  availableCountries: { code: string; name: string }[];
};

export async function getShippingCountries(): Promise<{ code: string; name: string }[]> {
  const rates = await prisma.shippingRate.findMany({ where: { active: true }, select: { countries: true } });
  const codes = new Set<string>();
  for (const r of rates) for (const c of r.countries.split(",")) if (c.trim()) codes.add(c.trim().toUpperCase());
  return [...codes]
    .filter((c) => c in COUNTRIES)
    .map((code) => ({ code, name: COUNTRIES[code] }))
    .sort((a, b) => (a.code === "ES" ? -1 : b.code === "ES" ? 1 : a.name.localeCompare(b.name, "es")));
}

export async function quoteShipping(country: string, subtotalCents: number): Promise<ShippingQuote | null> {
  const rates = await prisma.shippingRate.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const candidates = rates
    .filter((r) => r.countries.split(",").map((c) => c.trim().toUpperCase()).includes(country))
    .map((r) => {
      const free = r.freeOverCents != null && subtotalCents >= r.freeOverCents;
      return {
        rateId: r.id,
        name: r.name,
        priceCents: free ? 0 : r.priceCents,
        baseCents: r.priceCents,
        freeOverCents: r.freeOverCents,
        estimatedDaysMin: r.estimatedDaysMin,
        estimatedDaysMax: r.estimatedDaysMax,
      };
    })
    .sort((a, b) => a.priceCents - b.priceCents);
  return candidates[0] ?? null;
}

/**
 * Calcula el carrito SIEMPRE en el servidor con los precios de la base de datos.
 * Nunca se confía en precios enviados por el navegador.
 */
export async function quoteCart(items: CartItemInput[], country = "ES"): Promise<Quote> {
  // Agrupa cantidades del mismo producto
  const qty = new Map<string, number>();
  for (const it of items) qty.set(it.productId, Math.min(20, (qty.get(it.productId) ?? 0) + it.quantity));

  const products = await prisma.product.findMany({
    where: { id: { in: [...qty.keys()] } },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, category: { select: { active: true } } },
  });

  const issues: string[] = [];
  const removed: string[] = [];
  const lines: QuoteLine[] = [];
  const allowDemo = demoCheckoutAllowed();

  for (const [productId, quantity] of qty) {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.active || !p.category.active) {
      removed.push(productId);
      issues.push(p ? `«${p.name}» ya no está disponible.` : "Un producto de tu carrito ya no existe.");
      continue;
    }
    if (p.isDemo && !allowDemo) {
      removed.push(productId);
      issues.push(`«${p.name}» es un producto de demostración y no se puede comprar.`);
      continue;
    }
    if (p.stock <= 0) {
      removed.push(productId);
      issues.push(`«${p.name}» está agotado.`);
      continue;
    }
    let q = quantity;
    if (q > p.stock) {
      q = p.stock;
      issues.push(`Solo quedan ${p.stock} unidades de «${p.name}». Hemos ajustado la cantidad.`);
    }
    lines.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      sku: p.sku,
      imageUrl: p.images[0]?.url ?? null,
      unitPriceCents: p.priceCents,
      quantity: q,
      lineTotalCents: p.priceCents * q,
      stock: p.stock,
      isDemo: p.isDemo,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const availableCountries = await getShippingCountries();
  const c = availableCountries.some((x) => x.code === country) ? country : availableCountries[0]?.code ?? country;
  const shipping = lines.length ? await quoteShipping(c, subtotalCents) : null;

  return {
    lines,
    issues,
    removed,
    subtotalCents,
    shipping,
    totalCents: subtotalCents + (shipping?.priceCents ?? 0),
    country: c,
    availableCountries,
  };
}
