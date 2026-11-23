import type { OrderStatus, Carrier } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  PREPARING: "bg-sky-50 text-sky-800 ring-sky-200",
  SHIPPED: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  DELIVERED: "bg-ink-900 text-white ring-ink-900",
  CANCELLED: "bg-ink-100 text-ink-500 ring-ink-200",
  REFUNDED: "bg-rose-50 text-rose-800 ring-rose-200",
};

export const STATUS_ORDER: OrderStatus[] = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

/** Estados que cuentan como venta cobrada */
export const PAID_STATUSES: OrderStatus[] = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];

/**
 * Transiciones permitidas desde el panel. "Pagado" NO se puede marcar a mano:
 * solo lo confirma el webhook de Stripe.
 */
export const MANUAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PREPARING", "SHIPPED"],
  PREPARING: ["PAID", "SHIPPED"],
  SHIPPED: ["PREPARING", "DELIVERED"],
  DELIVERED: ["SHIPPED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const CARRIER_LABELS: Record<Carrier, string> = {
  NONE: "Sin asignar",
  CORREOS: "Correos",
  GLS: "GLS",
  DHL: "DHL",
  OTHER: "Otro",
};
