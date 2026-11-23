import { CarrierNotConfiguredError, type CarrierProvider } from "./types";

// Integración futura: API de Preregistro de Envíos de Correos (CEX / Correos Empresas).
// Documentación: solicitar acceso como cliente con contrato en https://www.correos.es/es/es/empresas
export const correos: CarrierProvider = {
  id: "CORREOS",
  name: "Correos",
  isConfigured: () =>
    Boolean(process.env.CORREOS_API_USER && process.env.CORREOS_API_PASSWORD && process.env.CORREOS_CONTRACT_CODE),
  trackingUrl: (n) => `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${encodeURIComponent(n)}`,
  async createLabel() {
    if (!this.isConfigured()) throw new CarrierNotConfiguredError("Correos");
    // TODO: llamada a PreregistroEnvio con los datos de order (destinatario, peso, bultos)
    // y devolver { trackingNumber, labelUrl } a partir de la respuesta.
    throw new Error("Integración con Correos pendiente de implementar con las credenciales del contrato.");
  },
};
