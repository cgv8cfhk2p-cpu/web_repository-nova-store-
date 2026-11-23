import { discountPercent, formatPrice } from "@/lib/money";

export function Price({ cents, compareAt, size = "md" }: { cents: number; compareAt?: number | null; size?: "sm" | "md" | "lg" }) {
  const pct = discountPercent(cents, compareAt);
  const main = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-[15px]";
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`${main} font-semibold tabular-nums ${pct ? "text-ink-900" : ""}`}>{formatPrice(cents)}</span>
      {pct ? (
        <>
          <span className="text-sm text-ink-400 line-through tabular-nums">{formatPrice(compareAt!)}</span>
          <span className="text-xs font-semibold text-ink-900">−{pct}%</span>
        </>
      ) : null}
    </span>
  );
}
