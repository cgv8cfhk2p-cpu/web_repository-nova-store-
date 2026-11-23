import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { store } from "@/config/store";

export const metadata: Metadata = {
  metadataBase: new URL(store.siteUrl),
  title: { default: "NOVASTORE — Perfumes, tecnología, zapatillas y moda", template: "%s · NOVASTORE" },
  description: store.tagline,
  openGraph: { siteName: "NOVASTORE", type: "website", locale: "es_ES" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
