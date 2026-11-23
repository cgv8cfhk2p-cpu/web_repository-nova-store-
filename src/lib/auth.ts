import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export async function getAdmin() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true },
  });
  return admin;
}

/** Úsalo al inicio de cada página, acción o API del panel. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function verifyCredentials(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Comparación aunque no exista el usuario para no revelar emails válidos por tiempo de respuesta
  const hash = admin?.passwordHash ?? "$2b$12$MsOXKXQn8CenFN55Zckp6OrNv8tPCuM5OiYCQBu6gQRcrqNY8ugYy";
  const ok = await bcrypt.compare(password, hash);
  return ok && admin ? admin : null;
}

export async function startSession(admin: { id: string; email: string }) {
  const token = await signSession({ sub: admin.id, email: admin.email });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
