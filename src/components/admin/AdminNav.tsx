"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, ExternalLink, FolderTree, LogOut, Menu, Package, ShoppingCart, Truck, Users, X } from "lucide-react";
import { logoutAction } from "@/app/admin/_actions/auth";

const LINKS = [
  { href: "/admin", label: "Ventas", icon: BarChart3 },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/envios", label: "Tarifas de envío", icon: Truck },
];

export function AdminNav({ email, testMode }: { email: string; testMode: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const content = (
    <>
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/admin" className="text-[15px] font-semibold tracking-brand text-white">NOVA<span className="font-light">STORE</span></Link>
        <button className="p-1 text-ink-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
      </div>
      {testMode && <div className="mx-4 mb-2 rounded-lg bg-amber-400/15 px-3 py-2 text-xs text-amber-300">Stripe en modo pruebas</div>}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive(href) ? "bg-white/10 text-white" : "text-ink-400 hover:bg-white/5 hover:text-white"}`}>
            <Icon className="h-4 w-4" strokeWidth={1.8} /> {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-400 hover:text-white">
          <ExternalLink className="h-4 w-4" /> Ver tienda
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-400 hover:text-white">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </form>
        <p className="truncate px-3 pt-2 text-[11px] text-ink-600">{email}</p>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink-900 px-4 lg:hidden">
        <button onClick={() => setOpen(true)} className="p-1 text-white" aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
        <span className="text-sm font-semibold tracking-brand text-white">NOVA<span className="font-light">STORE</span></span>
        <span className="w-7" />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink-900">{content}</aside>
        </div>
      )}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink-900 lg:flex">{content}</aside>
    </>
  );
}
