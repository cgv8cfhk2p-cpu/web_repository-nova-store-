export const store = {
  name: "NOVASTORE",
  tagline: "Perfumes, tecnología, calzado y moda. Seleccionados con criterio.",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "hola@novastore.example",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "[Nombre o razón social]",
  legalId: process.env.NEXT_PUBLIC_LEGAL_ID || "[NIF/CIF]",
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "[Dirección fiscal]",
  currency: "eur",
  returnDays: 14,
};
