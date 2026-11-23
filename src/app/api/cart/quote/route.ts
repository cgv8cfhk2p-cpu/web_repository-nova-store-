import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCart } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1).max(50), quantity: z.number().int().min(1).max(20) })).max(50),
  country: z.string().length(2).optional(),
});

// Calcula subtotal, gastos de envío y total con los precios reales de la base de datos.
export async function POST(req: Request) {
  const rl = rateLimit(`quote:${clientIp(req.headers)}`, 120, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
  if (parsed.data.items.length === 0) {
    return NextResponse.json({ lines: [], issues: [], removed: [], subtotalCents: 0, shipping: null, totalCents: 0 });
  }
  const quote = await quoteCart(parsed.data.items, parsed.data.country?.toUpperCase());
  return NextResponse.json(quote);
}
