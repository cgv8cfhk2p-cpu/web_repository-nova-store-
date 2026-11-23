import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { isTestMode } from "@/lib/stripe";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel NOVASTORE" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      <AdminNav email={admin.email} testMode={isTestMode()} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
