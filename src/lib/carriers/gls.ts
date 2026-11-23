import { CarrierNotConfiguredError, type CarrierProvider } from "./types";

// Integración futura: webservice GLS España (GrabaServicios / etiquetas).
export const gls: CarrierProvider = {
  id: "GLS",
  name: "GLS",
  isConfigured: () => Boolean(process.env.GLS_API_UID && process.env.GLS_API_URL),
  trackingUrl: (n) => `https://gls-group.com/ES/es/seguimiento-envio?match=${encodeURIComponent(n)}`,
  async createLabel() {
    if (!this.isConfigured()) throw new CarrierNotConfiguredError("GLS");
    throw new Error("Integración con GLS pendiente de implementar con el UID de cliente.");
  },
};
