import Image from "next/image";

/** Imagen de producto optimizada. Las SVG de demostración se sirven tal cual. */
export function ProductImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-ink-100 text-xs uppercase tracking-widest text-ink-400 ${className}`}>
        Sin imagen
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={`object-cover ${className}`}
    />
  );
}
