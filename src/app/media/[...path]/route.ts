import { promises as fs } from "fs";
import path from "path";
import { uploadDir } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

// Sirve las imágenes subidas desde el panel cuando se usa almacenamiento en disco.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const base = uploadDir();
  const full = path.resolve(base, ...parts);
  if (!full.startsWith(base + path.sep)) return new Response("Not found", { status: 404 });
  const ext = path.extname(full).slice(1).toLowerCase();
  if (!TYPES[ext]) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(full);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
