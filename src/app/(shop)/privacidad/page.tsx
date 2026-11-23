import type { Metadata } from "next";
import { InfoPage, TemplateNotice } from "@/components/shop/InfoPage";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Política de privacidad">
      <TemplateNotice />
      <h2>Responsable del tratamiento</h2>
      <p>{store.legalName} ({store.legalId}), con domicilio en {store.legalAddress}. Contacto: <a href={`mailto:${store.email}`}>{store.email}</a>.</p>
      <h2>Qué datos tratamos y para qué</h2>
      <ul>
        <li><strong>Datos de compra y envío</strong> (nombre, correo, teléfono, dirección): para gestionar tu pedido, el envío y la atención al cliente. Base legal: ejecución del contrato.</li>
        <li><strong>Datos de facturación</strong>: para cumplir nuestras obligaciones fiscales. Base legal: obligación legal.</li>
      </ul>
      <h2>Pagos</h2>
      <p>Los pagos se procesan a través de <strong>Stripe Payments Europe, Ltd.</strong> NOVASTORE no recibe ni almacena en ningún momento los datos de tu tarjeta bancaria. Stripe cumple con el estándar de seguridad PCI-DSS nivel 1.</p>
      <h2>Destinatarios</h2>
      <p>Compartimos los datos imprescindibles con: Stripe (pagos), empresas de transporte (Correos, GLS, DHL) para entregar tu pedido y nuestro proveedor de alojamiento web. No vendemos tus datos a terceros.</p>
      <h2>Conservación</h2>
      <p>Conservamos los datos de los pedidos durante el tiempo necesario para cumplir las obligaciones legales (en general, 6 años a efectos contables y fiscales).</p>
      <h2>Tus derechos</h2>
      <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a href={`mailto:${store.email}`}>{store.email}</a>. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
    </InfoPage>
  );
}
