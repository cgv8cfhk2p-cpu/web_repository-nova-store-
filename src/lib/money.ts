const formatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number): string {
  return formatter.format(cents / 100);
}

/** Convierte "19,99" o "19.99" a céntimos (1999). Devuelve null si no es válido. */
export function parsePriceToCents(input: string | null | undefined): number | null {
  if (input == null) return null;
  const clean = String(input).trim().replace(/\s|€/g, "").replace(",", ".");
  if (clean === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}
