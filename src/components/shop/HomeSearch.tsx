"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/tienda?q=${encodeURIComponent(q.trim())}` : "/tienda");
      }}
      className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-ink-200 bg-white p-2 pl-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.15)]"
    >
      <Search className="h-5 w-5 shrink-0 text-ink-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        maxLength={80}
        aria-label="Buscar productos"
        placeholder="¿Qué estás buscando?"
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-ink-400"
      />
      <button className="btn-primary px-5 py-2.5">Buscar</button>
    </form>
  );
}
