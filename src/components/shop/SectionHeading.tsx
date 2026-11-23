import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, href, linkLabel = "Ver todo" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl font-light tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
