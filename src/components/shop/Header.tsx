import { prisma } from "@/lib/db";
import { HeaderClient } from "./HeaderClient";
import { formatPrice } from "@/lib/money";
import { isTestMode } from "@/lib/stripe";

export async function Header() {
  const [categories, esRate] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true },
    }),
    prisma.shippingRate.findFirst({
      where: { active: true, countries: { contains: "ES" }, freeOverCents: { not: null } },
      orderBy: { freeOverCents: "asc" },
      select: { freeOverCents: true },
    }),
  ]);
  const announcement = esRate?.freeOverCents
    ? `Envío gratis en España a partir de ${formatPrice(esRate.freeOverCents)}`
    : "Envíos a España y Europa · Pago 100% seguro";
  return <HeaderClient categories={categories} announcement={announcement} testMode={isTestMode()} />;
}
