export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Producto de demostración: no es un artículo real a la venta"
      className={`badge bg-amber-100 text-amber-900 ring-1 ring-amber-300 ${className}`}
    >
      Demo
    </span>
  );
}
