import type { Metadata } from "next";
import { InfoPage, TemplateNotice } from "@/components/shop/InfoPage";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Aviso legal" };

export default function LegalPage() {
  return (
    <InfoPage eyebrow="Legal" title="Aviso legal">
      <TemplateNotice />
      <p>En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa:</p>
      <ul>
        <li><strong>Titular:</strong> {store.legalName}</li>
        <li><strong>NIF/CIF:</strong> {store.legalId}</li>
        <li><strong>Domicilio:</strong> {store.legalAddress}</li>
        <li><strong>Correo electrónico:</strong> {store.email}</li>
        <li><strong>Nombre comercial:</strong> NOVASTORE</li>
      </ul>
      <h2>Propiedad intelectual</h2>
      <p>Las marcas comerciales de los productos pertenecen a sus respectivos titulares. NOVASTORE es un comercio minorista multimarca.</p>
    </InfoPage>
  );
}
