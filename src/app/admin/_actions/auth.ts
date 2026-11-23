"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, startSession, verifyCredentials } from "@/lib/auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = clientIp(await headers());
  const email = String(formData.get("email") ?? "").slice(0, 160);
  const rl = rateLimit(`login:${ip}`, 5, 15 * 60_000); // 5 intentos cada 15 min
  if (!rl.ok) return { email, error: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(rl.retryAfter / 60)} min.` };

  const parsed = z
    .object({ email: z.string().email().max(160), password: z.string().min(1).max(200) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { email, error: "Introduce un email y una contraseña válidos." };

  const admin = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!admin) return { email, error: "Email o contraseña incorrectos." };

  resetRateLimit(`login:${ip}`);
  await startSession(admin);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}
