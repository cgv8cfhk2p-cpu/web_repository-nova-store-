import type { OrderStatus, Prisma } from "@prisma/client";
import { STATUS_ORDER } from "./order-status";

export function ordersWhere(sp: { estado?: string; q?: string }): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (sp.estado && STATUS_ORDER.includes(sp.estado as OrderStatus)) where.status = sp.estado as OrderStatus;
  const q = sp.q?.trim().slice(0, 80);
  if (q) {
    const num = Number(q.replace("#", ""));
    where.OR = [
      ...(Number.isInteger(num) && num > 0 && num < 2_147_483_647 ? [{ number: num }] : []),
      { shippingName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { trackingNumber: { contains: q, mode: "insensitive" } },
      { shippingPostalCode: { contains: q } },
    ];
  }
  return where;
}
