// Firma y verificación de la sesión del administrador (compatible con Edge/middleware).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ns_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 horas

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET no está configurada o es demasiado corta (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: string; email: string };

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setAudience("novastore-admin")
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"], audience: "novastore-admin" });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
