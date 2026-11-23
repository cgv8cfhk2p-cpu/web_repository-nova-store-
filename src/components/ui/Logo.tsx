import Link from "next/link";

export function Logo({ className = "", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="NOVASTORE — inicio"
      className={`group inline-flex items-center gap-2 select-none ${inverted ? "text-white" : "text-ink-900"} ${className}`}
    >
      <span className="relative text-[17px] font-semibold leading-none tracking-brand sm:text-lg">
        NOVA<span className="font-light">STORE</span>
        <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-current transition-all duration-500 group-hover:w-full" />
      </span>
    </Link>
  );
}
