import { NextResponse } from "next/server";
import { expireStalePendingOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Libera el stock de pedidos abandonados. Configurado en vercel.json para ejecutarse a diario (en el plan Pro de Vercel puede ser cada hora).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const count = await expireStalePendingOrders();
  return NextResponse.json({ expired: count });
}
