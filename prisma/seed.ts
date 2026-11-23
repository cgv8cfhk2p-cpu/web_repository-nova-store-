/**
import "dotenv/config";
 * Datos iniciales de NOVASTORE:
 *  - 4 categorías principales
 *  - Productos de DEMOSTRACIÓN (isDemo = true), claramente identificados en la tienda
 *  - Tarifas de envío por defecto
 *  - Usuario administrador (ADMIN_EMAIL / ADMIN_PASSWORD)
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { slug: "perfumes", name: "Perfumes y colonias", description: "Fragancias para él y para ella: eau de parfum, eau de toilette y colonias.", imageUrl: "/demo/cat-perfumes.svg", sortOrder: 0 },
  { slug: "electronica", name: "Electrónica y tecnología", description: "Audio, wearables, smartphones y accesorios.", imageUrl: "/demo/cat-electronica.svg", sortOrder: 1 },
  { slug: "zapatillas", name: "Zapatillas y calzado", description: "Sneakers, running y calzado casual.", imageUrl: "/demo/cat-zapatillas.svg", sortOrder: 2 },
  { slug: "ropa", name: "Ropa", description: "Básicos, sudaderas y prendas de temporada.", imageUrl: "/demo/cat-ropa.svg", sortOrder: 3 },
];

const D = "Producto de demostración: este artículo NO es real y no está a la venta. Sirve para mostrar cómo se verá tu catálogo. Elimínalo desde el panel (Productos → Eliminar productos demo) cuando añadas tus productos.";

type Demo = { slug: string; name: string; cat: string; price: number; compare?: number; stock: number; featured?: boolean; images: string[]; desc: string; daysAgo: number };

const products: Demo[] = [
  { slug: "demo-eau-de-parfum-ambar", name: "Eau de Parfum Ámbar 100 ml (demo)", cat: "perfumes", price: 8900, compare: 10900, stock: 25, featured: true, images: ["perfume-1", "perfume-3"], desc: "Notas de ámbar, vainilla y madera de sándalo.", daysAgo: 3 },
  { slug: "demo-colonia-citrica", name: "Colonia Cítrica 150 ml (demo)", cat: "perfumes", price: 4500, stock: 40, images: ["perfume-2"], desc: "Fresca y luminosa, con bergamota y neroli.", daysAgo: 12 },
  { slug: "demo-eau-de-toilette-noir", name: "Eau de Toilette Noir 50 ml (demo)", cat: "perfumes", price: 6200, stock: 3, featured: true, images: ["perfume-3", "perfume-1"], desc: "Intensa, con pimienta negra y cuero.", daysAgo: 30 },
  { slug: "demo-perfume-floral", name: "Perfume Floral Blanco 75 ml (demo)", cat: "perfumes", price: 7400, compare: 8900, stock: 18, images: ["perfume-4"], desc: "Jazmín, flor de azahar y almizcle blanco.", daysAgo: 1 },
  { slug: "demo-auriculares-inalambricos", name: "Auriculares inalámbricos ANC (demo)", cat: "electronica", price: 19900, compare: 24900, stock: 12, featured: true, images: ["headphones-1", "headphones-2"], desc: "Cancelación activa de ruido, 30 h de batería y carga rápida USB-C.", daysAgo: 2 },
  { slug: "demo-smartwatch", name: "Smartwatch deportivo (demo)", cat: "electronica", price: 14900, stock: 9, featured: true, images: ["watch-1"], desc: "GPS, pulsómetro y resistencia al agua 5 ATM.", daysAgo: 8 },
  { slug: "demo-altavoz-bluetooth", name: "Altavoz Bluetooth portátil (demo)", cat: "electronica", price: 5900, stock: 30, images: ["speaker-1"], desc: "Sonido 360°, resistente al agua IP67.", daysAgo: 20 },
  { slug: "demo-smartphone", name: "Smartphone 128 GB (demo)", cat: "electronica", price: 39900, stock: 5, images: ["phone-1"], desc: "Pantalla OLED de 6,1\", triple cámara.", daysAgo: 40 },
  { slug: "demo-portatil-ultraligero", name: "Portátil ultraligero 14\" (demo)", cat: "electronica", price: 89900, compare: 99900, stock: 4, images: ["laptop-1"], desc: "16 GB de RAM, SSD de 512 GB, 1,2 kg.", daysAgo: 6 },
  { slug: "demo-zapatillas-urbanas-blancas", name: "Zapatillas urbanas blancas (demo)", cat: "zapatillas", price: 9900, stock: 20, featured: true, images: ["sneaker-1", "sneaker-3"], desc: "Piel sintética, suela de goma y plantilla acolchada.", daysAgo: 4 },
  { slug: "demo-zapatillas-running", name: "Zapatillas running (demo)", cat: "zapatillas", price: 12900, compare: 14900, stock: 15, images: ["sneaker-2"], desc: "Amortiguación reactiva y malla transpirable.", daysAgo: 9 },
  { slug: "demo-sneakers-retro", name: "Sneakers retro (demo)", cat: "zapatillas", price: 8500, stock: 0, images: ["sneaker-3"], desc: "Diseño inspirado en los 90.", daysAgo: 50 },
  { slug: "demo-botas-chelsea", name: "Botas Chelsea (demo)", cat: "zapatillas", price: 11900, stock: 7, images: ["boot-1"], desc: "Elásticos laterales y suela dentada.", daysAgo: 15 },
  { slug: "demo-camiseta-basica-blanca", name: "Camiseta básica blanca (demo)", cat: "ropa", price: 1990, stock: 60, images: ["tshirt-1"], desc: "100% algodón orgánico, corte regular.", daysAgo: 5 },
  { slug: "demo-camiseta-oversize-negra", name: "Camiseta oversize negra (demo)", cat: "ropa", price: 2490, compare: 2990, stock: 45, featured: true, images: ["tshirt-2"], desc: "Algodón grueso de 240 g/m², corte amplio.", daysAgo: 2 },
  { slug: "demo-sudadera-capucha", name: "Sudadera con capucha (demo)", cat: "ropa", price: 4990, stock: 22, images: ["hoodie-1"], desc: "Felpa perchada, bolsillo canguro.", daysAgo: 11 },
  { slug: "demo-chaqueta-tecnica", name: "Chaqueta técnica (demo)", cat: "ropa", price: 9900, compare: 12900, stock: 8, images: ["jacket-1"], desc: "Cortavientos repelente al agua.", daysAgo: 7 },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const cats = await prisma.category.findMany();
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  let created = 0;
  for (const [i, p] of products.entries()) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    const createdAt = new Date(Date.now() - p.daysAgo * 86400_000);
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        brand: "Marca de ejemplo",
        description: `${p.desc}\n\n${D}`,
        priceCents: p.price,
        compareAtCents: p.compare ?? null,
        stock: p.stock,
        sku: `DEMO-${String(i + 1).padStart(3, "0")}`,
        featured: !!p.featured,
        isDemo: true,
        active: true,
        weightGrams: 500,
        categoryId: catId(p.cat),
        createdAt,
        images: { create: p.images.map((img, pos) => ({ url: `/demo/${img}.svg`, alt: `${p.name} — imagen de demostración`, position: pos })) },
      },
    });
    created++;
  }

  if ((await prisma.shippingRate.count()) === 0) {
    await prisma.shippingRate.createMany({
      data: [
        { name: "España — Estándar 24/72 h", countries: "ES", priceCents: 495, freeOverCents: 5000, estimatedDaysMin: 1, estimatedDaysMax: 3, sortOrder: 0 },
        { name: "Portugal y Andorra", countries: "PT,AD", priceCents: 795, freeOverCents: 9000, estimatedDaysMin: 2, estimatedDaysMax: 5, sortOrder: 1 },
        { name: "Unión Europea", countries: "FR,IT,DE,BE,NL,LU,AT,IE", priceCents: 1295, freeOverCents: 15000, estimatedDaysMin: 3, estimatedDaysMax: 7, sortOrder: 2 },
      ],
    });
  }

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && !password.includes("cambia")) {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (!existing) {
      if (password.length < 10) throw new Error("ADMIN_PASSWORD debe tener al menos 10 caracteres.");
      await prisma.adminUser.create({ data: { email, name: "Administrador", passwordHash: await bcrypt.hash(password, 12) } });
      console.log(`✔ Administrador creado: ${email}`);
    }
  } else {
    console.log("ℹ Define ADMIN_EMAIL y ADMIN_PASSWORD en .env para crear el administrador (o usa `npm run admin:create`).");
  }

  console.log(`✔ Seed completado. ${created} productos de demostración creados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
