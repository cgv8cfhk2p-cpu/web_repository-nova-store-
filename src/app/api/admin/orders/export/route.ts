import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ordersWhere } from "@/lib/admin-queries";
import { STATUS_LABELS, CARRIER_LABELS } from "@/lib/order-status";

export const dynamic = "force-dynamic";

function csv(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en Excel
  return `"${s.replace(/"/g, '""')}"`;
}

// Exporta pedidos (p. ej. para preparar envíos o la contabilidad)
export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const url = new URL(req.url);
  const where = ordersWhere({ estado: url.searchParams.get("estado") ?? undefined, q: url.searchParams.get("q") ?? undefined });
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 10_000, include: { items: true } });

  const header = ["Pedido", "Fecha", "Estado", "Nombre", "Email", "Teléfono", "Dirección", "Dirección 2", "CP", "Ciudad", "Provincia", "País", "Artículos", "Subtotal", "Envío", "Total", "Transportista", "Seguimiento"];
  const rows = orders.map((o) => [
    o.number, o.createdAt.toISOString(), STATUS_LABELS[o.status], o.shippingName, o.email, o.shippingPhone, o.shippingAddress1, o.shippingAddress2,
    o.shippingPostalCode, o.shippingCity, o.shippingProvince, o.shippingCountry,
    o.items.map((i) => `${i.quantity}x ${i.name}${i.sku ? ` (${i.sku})` : ""}`).join(" | "),
    (o.subtotalCents / 100).toFixed(2), (o.shippingCents / 100).toFixed(2), (o.totalCents / 100).toFixed(2), CARRIER_LABELS[o.carrier], o.trackingNumber,
  ]);
  const body = "﻿" + [header, ...rows].map((r) => r.map(csv).join(";")).join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-novastore-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
