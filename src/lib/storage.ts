import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function uploadDir() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
}

/** Comprueba la firma real del archivo (no solo la extensión). */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavi")) return "image/avif";
  return null;
}

export class UploadError extends Error {}

/** Guarda una imagen y devuelve su URL pública. */
export async function saveImage(file: File, folder: "products" | "categories"): Promise<string> {
  if (!file || file.size === 0) throw new UploadError("Archivo vacío.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("La imagen supera los 5 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !ALLOWED[type]) throw new UploadError("Formato no permitido. Usa JPG, PNG, WEBP o AVIF.");
  const name = `${folder}/${randomUUID()}.${ALLOWED[type]}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`novastore/${name}`, buf, { access: "public", contentType: type });
    return blob.url;
  }

  const dest = path.join(uploadDir(), name);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return `/media/${name}`;
}

export async function deleteImage(url: string) {
  try {
    if (url.startsWith("/media/")) {
      const rel = url.slice("/media/".length);
      const full = path.resolve(uploadDir(), rel);
      if (!full.startsWith(uploadDir() + path.sep)) return;
      await fs.unlink(full);
    } else if (process.env.BLOB_READ_WRITE_TOKEN && url.includes(".blob.vercel-storage.com")) {
      const { del } = await import("@vercel/blob");
      await del(url);
    }
  } catch {
    // si no existe, no pasa nada
  }
}
