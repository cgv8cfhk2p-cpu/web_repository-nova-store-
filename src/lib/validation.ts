import { z } from "zod";
import { COUNTRIES, ES_PROVINCES } from "./countries";

const text = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} es obligatorio` })
    .trim()
    .min(min, `${label} es obligatorio`)
    .max(max, `${label} es demasiado largo`)
    // sin caracteres de control
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), `${label} contiene caracteres no válidos`);

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(50),
      quantity: z.number().int().min(1).max(20),
    }),
  )
  .min(1, "El carrito está vacío")
  .max(50, "Demasiados productos en el carrito");

export const shippingSchema = z
  .object({
    fullName: text(3, 120, "Nombre y apellidos").refine((v) => v.includes(" "), "Introduce nombre y apellidos"),
    email: z.string().trim().toLowerCase().email("Correo electrónico no válido").max(160),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s().-]{6,20}$/, "Teléfono no válido"),
    country: z.string().refine((c) => c in COUNTRIES, "País no válido"),
    province: text(2, 80, "Provincia"),
    city: text(2, 80, "Ciudad"),
    postalCode: z.string().trim().regex(/^[A-Za-z0-9\s-]{3,10}$/, "Código postal no válido"),
    address1: text(5, 160, "Dirección"),
    address2: z.string().trim().max(160).optional().or(z.literal("")),
    // Campo trampa anti-bots: debe llegar vacío
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (d.country === "ES") {
      if (!/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(d.postalCode)) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Código postal español no válido (5 dígitos)" });
      }
      if (!ES_PROVINCES.includes(d.province)) {
        ctx.addIssue({ code: "custom", path: ["province"], message: "Selecciona una provincia válida" });
      }
    }
    if (d.country === "PT" && !/^\d{4}-?\d{3}$/.test(d.postalCode)) {
      ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Código postal portugués no válido (0000-000)" });
    }
  });

export const checkoutSchema = z.object({
  items: cartItemsSchema,
  shipping: shippingSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar las condiciones de compra" }) }),
});

export type ShippingInput = z.infer<typeof shippingSchema>;
export type CartItemInput = z.infer<typeof cartItemsSchema>[number];

export function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
