import type { Order, OrderItem } from "@prisma/client";

export type LabelResult = {
  trackingNumber: string;
  labelUrl?: string; // URL o data-URI del PDF de la etiqueta
  trackingUrl?: string;
};

/**
 * Contrato que debe cumplir cada transportista. Para activar la generación automática de
 * etiquetas basta con implementar `createLabel` usando la API oficial del transportista.
 */
export interface CarrierProvider {
  id: "CORREOS" | "GLS" | "DHL";
  name: string;
  /** true si las credenciales están en las variables de entorno */
  isConfigured(): boolean;
  trackingUrl(trackingNumber: string): string;
  createLabel(order: Order & { items: OrderItem[] }): Promise<LabelResult>;
}

export class CarrierNotConfiguredError extends Error {
  constructor(carrier: string) {
    super(`La integración con ${carrier} todavía no está configurada. Introduce el número de seguimiento manualmente.`);
  }
}
