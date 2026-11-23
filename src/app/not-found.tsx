import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <p className="text-7xl font-extralight tracking-tight">404</p>
      <p className="text-ink-500">La página que buscas no existe o ya no está disponible.</p>
      <Link href="/" className="btn-primary">Volver a la tienda</Link>
    </div>
  );
}
