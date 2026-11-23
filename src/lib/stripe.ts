import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("...")) {
    throw new Error("STRIPE_SECRET_KEY no está configurada. Revisa tu archivo .env");
  }
  const override = process.env.STRIPE_API_HOST_OVERRIDE;
  let hostConfig: Partial<Stripe.StripeConfig> = {};
  if (override && isTestMode()) {
    // Solo para pruebas automáticas con stripe-mock (nunca se aplica con claves live)
    const u = new URL(override);
    hostConfig = { host: u.hostname, port: Number(u.port || 80), protocol: u.protocol.replace(":", "") as "http" | "https" };
  }
  client = new Stripe(key, {
    appInfo: { name: "NOVASTORE", version: "1.0.0" },
    maxNetworkRetries: 2,
    ...hostConfig,
  });
  return client;
}

export function isTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return !key.startsWith("sk_live_") && !key.startsWith("rk_live_");
}

/** Los productos de demostración solo se pueden pagar en modo pruebas. */
export function demoCheckoutAllowed(): boolean {
  return isTestMode() && process.env.ALLOW_DEMO_CHECKOUT !== "false";
}
