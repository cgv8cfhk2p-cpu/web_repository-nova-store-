import { CarrierNotConfiguredError, type CarrierProvider } from "./types";

// Integración futura: DHL Express MyDHL API / DHL Parcel API.
export const dhl: CarrierProvider = {
  id: "DHL",
  name: "DHL",
  isConfigured: () => Boolean(process.env.DHL_API_KEY && process.env.DHL_API_SECRET && process.env.DHL_ACCOUNT_NUMBER),
  trackingUrl: (n) => `https://www.dhl.com/es-es/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
  async createLabel() {
    if (!this.isConfigured()) throw new CarrierNotConfiguredError("DHL");
    throw new Error("Integración con DHL pendiente de implementar con la cuenta de cliente.");
  },
};
