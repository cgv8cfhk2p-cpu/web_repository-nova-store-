/**
 * Prueba de extremo a extremo de NOVASTORE (carrito → pedido → Stripe → webhook → panel).
 *
 * Requisitos:
 *   - La tienda arrancada (npm run build && npm start, o npm run dev)
 *   - STRIPE_SECRET_KEY de PRUEBAS y STRIPE_WEBHOOK_SECRET en .env
 *   - Opcional: stripe-mock (STRIPE_API_HOST_OVERRIDE) para no depender de la red
 *
 * Uso: npm run test:e2e   (BASE_URL=http://localhost:3000 por defecto)
 * Crea pedidos de prueba en la base de datos y al terminar los elimina.
 */
import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_x");
const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const IP = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

let passed = 0;
let failed = 0;
const createdOrders: string[] = [];

function check(name: string, cond: unknown, extra?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}`, extra ?? "");
  }
}

async function http(path: string, init?: RequestInit) {
  return fetch(BASE + path, { redirect: "manual", ...init, headers: { "x-forwarded-for": IP, ...(init?.headers || {}) } });
}
async function postJson(path: string, body: unknown) {
  const res = await http(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function sendWebhook(type: string, object: Record<string, unknown>, opts: { secret?: string; id?: string } = {}) {
  const payload = JSON.stringify({
    id: opts.id ?? `evt_test_${Math.random().toString(36).slice(2)}`,
    object: "event",
    api_version: "2026-11-18",
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: opts.secret ?? WH_SECRET });
  const res = await http("/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": header, "Content-Type": "application/json" }, body: payload });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const shipping = {
  fullName: "Prueba Automática Test",
  email: "e2e-test@novastore.example",
  phone: "+34 600 000 000",
  country: "ES",
  province: "Madrid",
  city: "Madrid",
  postalCode: "28013",
  address1: "Calle de Prueba 1",
  address2: "3º B",
  website: "",
};

async function main() {
  console.log(`\nNOVASTORE · pruebas E2E contra ${BASE}\n`);

  // ── 1. Páginas públicas ─────────────────────────────────────────
  console.log("1. Tienda pública");
  for (const p of ["/", "/tienda", "/ofertas", "/categoria/perfumes", "/categoria/electronica", "/categoria/zapatillas", "/categoria/ropa", "/carrito", "/checkout", "/envios", "/devoluciones", "/privacidad", "/aviso-legal", "/contacto", "/sitemap.xml", "/robots.txt"]) {
    const r = await http(p);
    check(`GET ${p} → 200`, r.status === 200, r.status);
  }
  check("Categoría inexistente → 404", (await http("/categoria/no-existe")).status === 404);
  const search = await (await http("/tienda?q=auriculares")).text();
  check("Buscador encuentra «auriculares»", search.includes("Auriculares inalámbricos"));
  const priceFilter = await (await http("/tienda?min=100&max=200")).text();
  check("Filtro por precio 100-200 € incluye smartwatch (149 €)", priceFilter.includes("Smartwatch deportivo"));
  check("Filtro por precio excluye camiseta (19,90 €)", !priceFilter.includes("Camiseta básica blanca"));
  const home = await (await http("/")).text();
  check("Portada muestra productos destacados y novedades", home.includes("Productos destacados") && home.includes("Últimas novedades"));
  check("Portada muestra el contenido demo identificado", home.includes(">Demo<"));

  // ── 2. Carrito y envío ──────────────────────────────────────────
  console.log("\n2. Carrito y gastos de envío");
  const cheap = await prisma.product.findUniqueOrThrow({ where: { slug: "demo-camiseta-basica-blanca" } });
  const pricey = await prisma.product.findUniqueOrThrow({ where: { slug: "demo-auriculares-inalambricos" } });
  const soldOut = await prisma.product.findUniqueOrThrow({ where: { slug: "demo-sneakers-retro" } });

  let q = await postJson("/api/cart/quote", { items: [{ productId: cheap.id, quantity: 1 }], country: "ES" });
  check("Subtotal calculado con precio de la BD", q.data.subtotalCents === cheap.priceCents, q.data);
  check("Envío España 4,95 € por debajo de 50 €", q.data.shipping?.priceCents === 495, q.data.shipping);
  check("Total = subtotal + envío", q.data.totalCents === cheap.priceCents + 495);
  q = await postJson("/api/cart/quote", { items: [{ productId: pricey.id, quantity: 1 }], country: "ES" });
  check("Envío gratis en España a partir de 50 €", q.data.shipping?.priceCents === 0);
  q = await postJson("/api/cart/quote", { items: [{ productId: cheap.id, quantity: 2 }], country: "FR" });
  check("Envío a Francia 12,95 €", q.data.shipping?.priceCents === 1295);
  q = await postJson("/api/cart/quote", { items: [{ productId: soldOut.id, quantity: 1 }] });
  check("Producto agotado se elimina del carrito", q.data.removed?.includes(soldOut.id) && q.data.lines.length === 0);
  q = await postJson("/api/cart/quote", { items: [{ productId: pricey.id, quantity: 20 }] });
  check("La cantidad se ajusta al stock disponible", q.data.lines[0]?.quantity === pricey.stock, q.data.lines);

  // ── 3. Validación y antifraude en el checkout ───────────────────
  console.log("\n3. Validación del checkout");
  let c = await postJson("/api/checkout", { items: [{ productId: cheap.id, quantity: 1 }], shipping: { ...shipping, email: "no-es-email", postalCode: "99999" }, acceptTerms: true });
  check("Datos inválidos → 400 con errores por campo", c.status === 400 && c.data.fields?.["shipping.email"] && c.data.fields?.["shipping.postalCode"], c.data);
  c = await postJson("/api/checkout", { items: [{ productId: cheap.id, quantity: 1 }], shipping: { ...shipping, website: "http://spam" }, acceptTerms: true });
  check("Campo trampa anti-bots rellenado → rechazado", c.status === 400);
  c = await postJson("/api/checkout", { items: [{ productId: cheap.id, quantity: 1 }], shipping, acceptTerms: false });
  check("Sin aceptar condiciones → rechazado", c.status === 400);
  c = await postJson("/api/checkout", { items: [{ productId: cheap.id, quantity: 1 }], shipping: { ...shipping, country: "US" }, acceptTerms: true });
  check("País sin envío → rechazado", c.status === 400);
  c = await postJson("/api/checkout", { items: [{ productId: soldOut.id, quantity: 1 }], shipping, acceptTerms: true });
  check("Producto agotado → 409 (no se crea pedido)", c.status === 409);

  // ── 4. Pedido + Stripe Checkout ─────────────────────────────────
  console.log("\n4. Pedido y sesión de Stripe Checkout");
  const stockBefore = (await prisma.product.findUniqueOrThrow({ where: { id: pricey.id } })).stock;
  c = await postJson("/api/checkout", { items: [{ productId: pricey.id, quantity: 2 }, { productId: cheap.id, quantity: 1 }], shipping, acceptTerms: true });
  check("Checkout válido devuelve la URL de Stripe", c.status === 200 && typeof c.data.url === "string" && c.data.url.startsWith("https://checkout.stripe.com"), c.data);
  const order = await prisma.order.findFirstOrThrow({ where: { number: c.data.orderNumber }, include: { items: true, customer: true } });
  createdOrders.push(order.id);
  check("Pedido guardado en estado PENDIENTE", order.status === "PENDING");
  check("Pedido enlazado a la sesión de Stripe", !!order.stripeSessionId?.startsWith("cs_"));
  check("Importes correctos (2×199 + 19,90, envío gratis)", order.subtotalCents === pricey.priceCents * 2 + cheap.priceCents && order.shippingCents === 0 && order.totalCents === order.subtotalCents);
  check("Líneas de pedido guardadas", order.items.length === 2);
  check("Dirección de envío guardada completa",
    order.shippingName === shipping.fullName && order.shippingAddress1 === shipping.address1 && order.shippingAddress2 === shipping.address2 &&
    order.shippingCity === "Madrid" && order.shippingProvince === "Madrid" && order.shippingPostalCode === "28013" && order.shippingCountry === "ES" && order.shippingPhone === shipping.phone);
  check("Cliente creado/asociado", order.customer.email === shipping.email);
  const stockReserved = (await prisma.product.findUniqueOrThrow({ where: { id: pricey.id } })).stock;
  check("Stock reservado al iniciar el pago", stockReserved === stockBefore - 2, { stockBefore, stockReserved });
  const pendingPage = await (await http(`/checkout/exito?session_id=${order.stripeSessionId}`)).text();
  check("Página de éxito NO confirma antes del webhook", pendingPage.includes("Estamos confirmando tu pago"));

  // ── 5. Webhooks ─────────────────────────────────────────────────
  console.log("\n5. Webhooks de Stripe");
  const sessionObj = {
    id: order.stripeSessionId,
    object: "checkout.session",
    payment_status: "paid",
    status: "complete",
    amount_total: order.totalCents,
    currency: "eur",
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    payment_intent: `pi_test_${order.id}`,
  };
  let w = await sendWebhook("checkout.session.completed", sessionObj, { secret: "whsec_falso" });
  check("Firma inválida → 400 (rechazado)", w.status === 400);
  check("…y el pedido sigue pendiente", (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status === "PENDING");

  w = await sendWebhook("checkout.session.completed", { ...sessionObj, amount_total: 100 });
  check("Importe manipulado → no se marca como pagado", w.status === 200 && (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status === "PENDING");

  const evtId = `evt_test_paid_${order.id}`;
  w = await sendWebhook("checkout.session.completed", sessionObj, { id: evtId });
  const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  check("checkout.session.completed → PAGADO", w.status === 200 && paid.status === "PAID" && !!paid.paidAt, w);
  check("Payment Intent guardado (sin datos de tarjeta)", paid.stripePaymentIntentId === `pi_test_${order.id}`);
  w = await sendWebhook("checkout.session.completed", sessionObj, { id: evtId });
  check("Evento duplicado ignorado (idempotencia)", w.data.duplicate === true);
  check("Stock no se descuenta dos veces", (await prisma.product.findUniqueOrThrow({ where: { id: pricey.id } })).stock === stockBefore - 2);
  const paidPage = await (await http(`/checkout/exito?session_id=${order.stripeSessionId}`)).text();
  check("Página de éxito confirma tras el webhook", paidPage.includes("Gracias por tu compra"));

  // Sesión caducada → cancelado + stock devuelto
  const stockCheap = (await prisma.product.findUniqueOrThrow({ where: { id: cheap.id } })).stock;
  c = await postJson("/api/checkout", { items: [{ productId: cheap.id, quantity: 3 }], shipping: { ...shipping, country: "PT", province: "Lisboa", city: "Lisboa", postalCode: "1100-148" }, acceptTerms: true });
  const order2 = await prisma.order.findFirstOrThrow({ where: { number: c.data.orderNumber } });
  createdOrders.push(order2.id);
  check("Pedido a Portugal con envío 7,95 €", order2.shippingCents === 795 && order2.shippingCountry === "PT");
  check("Stock reservado (−3)", (await prisma.product.findUniqueOrThrow({ where: { id: cheap.id } })).stock === stockCheap - 3);
  w = await sendWebhook("checkout.session.expired", { id: order2.stripeSessionId, object: "checkout.session", payment_status: "unpaid", status: "expired", metadata: { orderId: order2.id } });
  const exp = await prisma.order.findUniqueOrThrow({ where: { id: order2.id } });
  check("checkout.session.expired → CANCELADO", exp.status === "CANCELLED");
  check("Stock devuelto al caducar", (await prisma.product.findUniqueOrThrow({ where: { id: cheap.id } })).stock === stockCheap);

  // Reembolso
  w = await sendWebhook("charge.refunded", { id: "ch_test_1", object: "charge", payment_intent: `pi_test_${order.id}`, refunded: true, amount_refunded: order.totalCents });
  check("charge.refunded → REEMBOLSADO", (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status === "REFUNDED");

  // ── 6. Seguridad del panel ──────────────────────────────────────
  console.log("\n6. Protección del panel de administración");
  let r = await http("/admin");
  check("/admin sin sesión → redirige al login", r.status === 307 && r.headers.get("location")?.includes("/admin/login"));
  r = await http("/admin/pedidos");
  check("/admin/pedidos sin sesión → redirige", r.status === 307);
  r = await http("/api/admin/orders/export");
  check("API de admin sin sesión → 401", r.status === 401);
  r = await http("/admin", { headers: { cookie: "ns_admin_session=token.falso.firmado" } });
  check("Cookie de sesión falsificada → rechazada", r.status === 307);
  check("Login accesible", (await http("/admin/login")).status === 200);
}

main()
  .catch((e) => {
    failed++;
    console.error(e);
  })
  .finally(async () => {
    if (createdOrders.length && process.env.KEEP_TEST_DATA !== "1") {
      // Restaura el stock de los pedidos de prueba que lo consumieron y los elimina
      for (const id of createdOrders) {
        const o = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        if (o && !o.stockReleased) for (const it of o.items) if (it.productId) await prisma.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
        await prisma.order.delete({ where: { id } }).catch(() => {});
      }
      await prisma.customer.deleteMany({ where: { email: shipping.email, orders: { none: {} } } });
    }
    await prisma.$disconnect();
    console.log(`\nResultado: ${passed} correctas, ${failed} fallidas\n`);
    process.exit(failed ? 1 : 0);
  });
