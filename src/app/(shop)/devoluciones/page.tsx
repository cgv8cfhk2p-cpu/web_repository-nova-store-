import type { Metadata } from "next";
import { InfoPage, TemplateNotice } from "@/components/shop/InfoPage";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Devoluciones y reembolsos" };

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Ayuda" title="Devoluciones y reembolsos">
      <TemplateNotice />
      <p>Dispones de <strong>{store.returnDays} días naturales</strong> desde la recepción del pedido para ejercer tu derecho de desistimiento, sin necesidad de justificación (art. 102 y ss. del Real Decreto Legislativo 1/2007).</p>
      <h2>Cómo solicitar una devolución</h2>
      <ul>
        <li>Escríbenos a <a href={`mailto:${store.email}`}>{store.email}</a> indicando tu número de pedido y los artículos que quieres devolver.</li>
        <li>Te enviaremos las instrucciones y la dirección de devolución.</li>
        <li>El producto debe estar en perfecto estado, con su embalaje original y etiquetas.</li>
      </ul>
      <h2>Excepciones</h2>
      <ul>
        <li>Perfumes y cosméticos precintados que hayan sido abiertos, por motivos de higiene y protección de la salud.</li>
        <li>Productos personalizados o confeccionados a medida.</li>
        <li>Software o contenidos digitales desprecintados.</li>
      </ul>
      <h2>Reembolso</h2>
      <p>Una vez recibido y revisado el producto, realizaremos el reembolso en un plazo máximo de 14 días utilizando el mismo método de pago empleado en la compra. Los gastos de devolución corren a cargo del cliente salvo que el producto sea defectuoso o no corresponda con lo pedido.</p>
      <h2>Garantía</h2>
      <p>Todos los productos nuevos tienen una garantía legal de conformidad de 3 años.</p>
    </InfoPage>
  );
}
