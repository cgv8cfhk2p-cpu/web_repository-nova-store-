import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { ES_PROVINCES } from "@/lib/countries";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ pais?: string }> }) {
  const { pais } = await searchParams;
  return <CheckoutForm initialCountry={(pais || "ES").toUpperCase().slice(0, 2)} provinces={ES_PROVINCES} />;
}
