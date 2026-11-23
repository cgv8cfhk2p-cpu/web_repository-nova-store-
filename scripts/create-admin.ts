/**
import "dotenv/config";
 * Crea o actualiza un administrador.
 * Uso: npm run admin:create -- email@dominio.com "ContraseñaSegura123"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Uso: npm run admin:create -- email@dominio.com "ContraseñaSegura123"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("La contraseña debe tener al menos 10 caracteres.");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash },
    create: { email: email.toLowerCase().trim(), passwordHash, name: "Administrador" },
  });
  console.log(`✔ Administrador listo: ${admin.email}`);
}

main().finally(() => prisma.$disconnect());
