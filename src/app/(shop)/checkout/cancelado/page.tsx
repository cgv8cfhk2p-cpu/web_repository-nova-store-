import type { Metadata } from "next";
import Link from "next/link";
import { CancelOrder } from "@/components/shop/CancelOrder";

export const metadata: Metadata = { title: "Pago cancelado", robots: { index: false } };

export default async function CancelledPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <div className="container-ns flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      {order && <CancelOrder orderId={order} />}
      <p className="eyebrow mb-3">Pago no completado</p>
      <h1 className="text-4xl font-light tracking-tight">Has cancelado el pago</h1>
      <p className="mt-4 max-w-md text-ink-500">No se ha realizado ningún cargo. Tus productos siguen en el carrito por si quieres terminar la compra.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/carrito" className="btn-primary">Volver al carrito</Link>
        <Link href="/tienda" className="btn-secondary">Seguir comprando</Link>
      </div>
    </div>
  );
}
