import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Acceso administración", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold tracking-brand">NOVA<span className="font-light">STORE</span></p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-ink-500">Panel de administración</p>
        </div>
        <div className="card p-8 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
