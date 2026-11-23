import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/order-status";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ring-1 ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function Panel({ title, children, className = "", actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-ink-200 bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <span className="text-ink-500">Página {page} de {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className="btn-secondary px-4 py-2">Anterior</Link>}
        {page < pages && <Link href={href(page + 1)} className="btn-secondary px-4 py-2">Siguiente</Link>}
      </div>
    </div>
  );
}

export function Flash({ type = "ok", children }: { type?: "ok" | "error"; children: React.ReactNode }) {
  return (
    <div role="status" className={`mb-6 rounded-xl px-4 py-3 text-sm ${type === "ok" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"}`}>
      {children}
    </div>
  );
}
