import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { InfoPage } from "@/components/shop/InfoPage";
import { SocialIcons } from "@/components/shop/SocialIcons";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Contacto" };

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Ayuda" title="Contacto">
      <p>¿Tienes dudas sobre un producto o tu pedido? Escríbenos y te responderemos en menos de 24 horas laborables.</p>
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        <a href={`mailto:${store.email}`} className="card flex items-center gap-4 p-6 no-underline transition hover:border-ink-900">
          <Mail className="h-5 w-5" strokeWidth={1.5} />
          <span><span className="block text-xs uppercase tracking-wider text-ink-500">Email</span><span className="font-medium text-ink-900">{store.email}</span></span>
        </a>
        {store.phone && (
          <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="card flex items-center gap-4 p-6 no-underline transition hover:border-ink-900">
            <Phone className="h-5 w-5" strokeWidth={1.5} />
            <span><span className="block text-xs uppercase tracking-wider text-ink-500">Teléfono</span><span className="font-medium text-ink-900">{store.phone}</span></span>
          </a>
        )}
      </div>
      <p>Indica siempre tu número de pedido para agilizar la respuesta.</p>
      <div className="not-prose inline-block rounded-2xl bg-ink-900 p-4"><SocialIcons /></div>
    </InfoPage>
  );
}
