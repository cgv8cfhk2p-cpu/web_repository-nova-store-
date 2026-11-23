import type { Metadata } from "next";
import { InfoPage } from "@/components/shop/InfoPage";

export const metadata: Metadata = { title: "Política de cookies" };

export default function CookiesPage() {
  return (
    <InfoPage eyebrow="Legal" title="Política de cookies">
      <p>NOVASTORE solo utiliza almacenamiento técnico imprescindible para el funcionamiento de la tienda:</p>
      <ul>
        <li><strong>Carrito</strong> (almacenamiento local del navegador): guarda los productos que añades.</li>
        <li><strong>Sesión de administración</strong>: solo para el personal de la tienda.</li>
        <li><strong>Stripe</strong>: durante el pago, Stripe utiliza cookies propias para prevenir el fraude.</li>
      </ul>
      <p>No utilizamos cookies publicitarias ni analíticas. Si en el futuro se añaden (por ejemplo, píxeles de TikTok o Meta), se mostrará un banner para solicitar tu consentimiento.</p>
    </InfoPage>
  );
}
