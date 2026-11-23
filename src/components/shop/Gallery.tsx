"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";

export function Gallery({ images }: { images: { url: string; alt: string }[] }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return <div className="relative aspect-square overflow-hidden rounded-3xl bg-ink-100"><ProductImage src={null} alt="" /></div>;
  }
  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto sm:w-20 sm:flex-col">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100 ring-offset-2 transition sm:w-20 ${
                i === active ? "ring-2 ring-ink-900" : "opacity-60 hover:opacity-100"
              }`}
            >
              <ProductImage src={img.url} alt={img.alt} sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-3xl bg-ink-100">
        {images.map((img, i) => (
          <div key={img.url} className={`absolute inset-0 transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`} aria-hidden={i !== active}>
            <ProductImage src={img.url} alt={img.alt} sizes="(min-width:1024px) 55vw, 100vw" priority={i === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
