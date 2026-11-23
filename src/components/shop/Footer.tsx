import Link from "next/link";
import { prisma } from "@/lib/db";
import { store } from "@/config/store";
import { Logo } from "@/components/ui/Logo";
import { SocialIcons } from "./SocialIcons";

export async function Footer() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true },
    take: 8,
  });
  return (
    <footer className="mt-24 bg-ink-900 text-ink-300">
      <div className="container-ns grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-ink-400">{store.tagline}</p>
          <SocialIcons />
        </div>
        <FooterCol title="Tienda">
          <FooterLink href="/tienda">Todos los productos</FooterLink>
          {categories.map((c) => (
            <FooterLink key={c.slug} href={`/categoria/${c.slug}`}>{c.name}</FooterLink>
          ))}
          <FooterLink href="/ofertas">Ofertas</FooterLink>
        </FooterCol>
        <FooterCol title="Ayuda">
          <FooterLink href="/envios">Envíos y entregas</FooterLink>
          <FooterLink href="/devoluciones">Devoluciones y reembolsos</FooterLink>
          <FooterLink href="/contacto">Contacto</FooterLink>
        </FooterCol>
        <FooterCol title="Contacto">
          <li><a className="transition hover:text-white" href={`mailto:${store.email}`}>{store.email}</a></li>
          {store.phone && <li><a className="transition hover:text-white" href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a></li>}
          <li className="pt-2 text-ink-500">Lunes a viernes, 9:00–18:00</li>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="container-ns flex flex-col gap-4 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NOVASTORE. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link href="/aviso-legal" className="hover:text-white">Aviso legal</Link>
            <Link href="/condiciones" className="hover:text-white">Condiciones de compra</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
          </div>
          <PaymentBadges />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white">{title}</h3>
      <ul className="space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition hover:text-white">{children}</Link>
    </li>
  );
}

function PaymentBadges() {
  const items = ["VISA", "Mastercard", "Apple Pay", "Google Pay"];
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Métodos de pago aceptados">
      {items.map((i) => (
        <span key={i} className="rounded border border-white/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-ink-300">{i}</span>
      ))}
    </div>
  );
}
