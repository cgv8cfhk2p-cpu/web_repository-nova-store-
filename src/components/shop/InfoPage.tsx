export function InfoPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="container-ns max-w-3xl py-12 sm:py-20">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-4xl font-light tracking-tight sm:text-5xl">{title}</h1>
      {updated && <p className="mt-3 text-xs text-ink-400">Última actualización: {updated}</p>}
      <div className="prose-ns mt-10 space-y-5 text-[15px] leading-relaxed text-ink-600 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-900 [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-ink-900">
        {children}
      </div>
    </div>
  );
}

export function TemplateNotice() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      Texto orientativo. Revísalo con un asesor legal y completa los datos entre corchetes antes de publicar la tienda.
    </div>
  );
}
