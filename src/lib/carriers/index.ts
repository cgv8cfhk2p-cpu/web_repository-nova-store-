import type { Carrier } from "@prisma/client";
import { correos } from "./correos";
import { gls } from "./gls";
import { dhl } from "./dhl";
import type { CarrierProvider } from "./types";

export const carriers: Record<"CORREOS" | "GLS" | "DHL", CarrierProvider> = { CORREOS: correos, GLS: gls, DHL: dhl };

export function getCarrier(c: Carrier): CarrierProvider | null {
  return c === "CORREOS" || c === "GLS" || c === "DHL" ? carriers[c] : null;
}

export function buildTrackingUrl(c: Carrier, trackingNumber: string | null | undefined): string | null {
  if (!trackingNumber) return null;
  return getCarrier(c)?.trackingUrl(trackingNumber) ?? null;
}

export * from "./types";
