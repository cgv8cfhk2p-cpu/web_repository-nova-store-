import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { checkoutSchema, zodErrors } from "@/lib/validation";
import { quoteCart } from "@/lib/pricing";
import { createPendingOrder, cancelOrderAndReleaseStock, OutOfStockError } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { store } from "@/config/store";

function absoluteUrl(path: string) {
  return `${store.siteUrl}${path}`;
}

function toStripeImage(url: string | null): string[] | undefined {
  if (!url) return undefined;
  const abs = url.startsWith("http") ? url : absoluteUrl(url);
  // Stripe solo acepta imágenes accesibles públicamente por https y en formato raster
  return abs.startsWith("https://") && !abs.endsWith(".svg") ? [abs] : undefined;
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  // Protección anti-abuso: máx. 10 intentos de pago por IP cada 10 minutos
  const rl = rateLimit(`checkout:${ip}`, 10, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Has hecho demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const origin = req.headers.get("origin");
  if (origin && process.env.NODE_ENV === "production" && origin !== store.siteUrl) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa los datos del formulario", fields: zodErrors(parsed.error) }, { status: 400 });
  }
  const { items, shipping } = parsed.data;

  const quote = await quoteCart(items, shipping.country);
  if (quote.country !== shipping.country) {
    return NextResponse.json({ error: "Todavía no enviamos a ese país.", fields: { "shipping.country": "Sin envíos a este país" } }, { status: 400 });
  }
  if (quote.issues.length || quote.lines.length === 0) {
    // El carrito ha cambiado (precio, stock o disponibilidad): el cliente debe revisarlo
    return NextResponse.json({ error: "Tu carrito ha cambiado. Revísalo antes de pagar.", issues: quote.issues, quote }, { status: 409 });
  }
  if (!quote.shipping) {
    return NextResponse.json({ error: "No hay tarifa de envío disponible para ese país." }, { status: 400 });
  }
  if (quote.totalCents < 50) {
    return NextResponse.json({ error: "El importe mínimo de pedido es 0,50 €" }, { status: 400 });
  }

  let order;
  try {
    order = await createPendingOrder(quote, shipping, ip);
  } catch (e) {
    if (e instanceof OutOfStockError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }

  try {
    const stripe = getStripe();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = quote.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "eur",
        unit_amount: l.unitPriceCents,
        product_data: {
          name: l.isDemo ? `[DEMO] ${l.name}` : l.name,
          images: toStripeImage(l.imageUrl),
          metadata: { productId: l.productId },
        },
      },
    }));

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        // Sin payment_method_types: Stripe muestra automáticamente tarjeta, Apple Pay, Google Pay
        // y los métodos que actives en el Dashboard (Ajustes → Métodos de pago).
        line_items: lineItems,
        customer_email: shipping.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: String(order.number) },
        payment_intent_data: {
          metadata: { orderId: order.id, orderNumber: String(order.number) },
          description: `NOVASTORE pedido #${order.number}`,
          statement_descriptor_suffix: `PEDIDO ${order.number}`.slice(0, 22),
          shipping: {
            name: shipping.fullName,
            phone: shipping.phone,
            address: {
              line1: shipping.address1,
              line2: shipping.address2 || undefined,
              city: shipping.city,
              state: shipping.province,
              postal_code: shipping.postalCode,
              country: shipping.country,
            },
          },
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: quote.shipping.name,
              fixed_amount: { amount: quote.shipping.priceCents, currency: "eur" },
              delivery_estimate: {
                minimum: { unit: "business_day", value: quote.shipping.estimatedDaysMin },
                maximum: { unit: "business_day", value: quote.shipping.estimatedDaysMax },
              },
            },
          },
        ],
        locale: "es",
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutos para pagar
        success_url: absoluteUrl(`/checkout/exito?session_id={CHECKOUT_SESSION_ID}`),
        cancel_url: absoluteUrl(`/checkout/cancelado?order=${order.id}`),
      },
      { idempotencyKey: `checkout-${order.id}` },
    );

    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    return NextResponse.json({ url: session.url, orderNumber: order.number });
  } catch (e) {
    console.error("[checkout] Error creando la sesión de Stripe", e);
    await cancelOrderAndReleaseStock(order.id, "Error al crear la sesión de pago en Stripe.");
    return NextResponse.json({ error: "No se ha podido iniciar el pago. Inténtalo de nuevo en unos minutos." }, { status: 502 });
  }
}
