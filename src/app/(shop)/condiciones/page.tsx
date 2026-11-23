import type { Metadata } from "next";
import { InfoPage, TemplateNotice } from "@/components/shop/InfoPage";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Condiciones de compra" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title="Condiciones generales de compra">
      <TemplateNotice />
      <h2>1. Vendedor</h2>
      <p>{store.legalName} ({store.legalId}), {store.legalAddress}, que opera bajo el nombre comercial NOVASTORE.</p>
      <h2>2. Precios</h2>
      <p>Todos los precios incluyen IVA. Los gastos de envío se indican antes de finalizar la compra y dependen del país de destino.</p>
      <h2>3. Proceso de compra y pago</h2>
      <p>El contrato se perfecciona cuando el pago es confirmado por nuestra pasarela de pago (Stripe). Aceptamos tarjetas de débito y crédito, Apple Pay y Google Pay. Si el pago no se confirma, el pedido se cancela automáticamente.</p>
      <h2>4. Disponibilidad</h2>
      <p>Las existencias se reservan durante el proceso de pago. Si por cualquier circunstancia un producto no estuviera disponible tras el pago, te contactaremos y te reembolsaremos el importe íntegro.</p>
      <h2>5. Envío, desistimiento y garantía</h2>
      <p>Consulta las páginas de <a href="/envios">envíos</a> y <a href="/devoluciones">devoluciones</a>.</p>
      <h2>6. Legislación aplicable</h2>
      <p>Estas condiciones se rigen por la legislación española. Plataforma europea de resolución de litigios en línea: ec.europa.eu/consumers/odr.</p>
    </InfoPage>
  );
}
