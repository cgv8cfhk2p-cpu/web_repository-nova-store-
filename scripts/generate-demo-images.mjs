// Genera ilustraciones SVG monocromas para el contenido de demostración.
// Uso: node scripts/generate-demo-images.mjs  → public/demo/*.svg
import { mkdirSync, writeFileSync } from "fs";

const OUT = "public/demo";
mkdirSync(OUT, { recursive: true });

const shapes = {
  perfume: (c) => `
    <rect x="345" y="250" width="110" height="70" rx="10" fill="${c.dark}"/>
    <rect x="375" y="310" width="50" height="50" fill="${c.mid}"/>
    <rect x="250" y="350" width="300" height="380" rx="46" fill="${c.glass}" stroke="${c.dark}" stroke-width="6"/>
    <rect x="270" y="370" width="60" height="330" rx="28" fill="#fff" opacity=".35"/>
    <rect x="310" y="500" width="180" height="90" rx="6" fill="${c.dark}"/>
    <text x="400" y="555" text-anchor="middle" font-family="Helvetica,Arial" font-size="26" letter-spacing="6" fill="#fff">EAU</text>`,
  perfume2: (c) => `
    <circle cx="400" cy="560" r="190" fill="${c.glass}" stroke="${c.dark}" stroke-width="6"/>
    <circle cx="340" cy="500" r="50" fill="#fff" opacity=".35"/>
    <rect x="360" y="290" width="80" height="90" rx="6" fill="${c.dark}"/>
    <rect x="380" y="370" width="40" height="10" fill="${c.mid}"/>
    <text x="400" y="575" text-anchor="middle" font-family="Helvetica,Arial" font-size="30" letter-spacing="8" fill="${c.dark}">N°7</text>`,
  headphones: (c) => `
    <path d="M230 560 V470 a170 170 0 0 1 340 0 V560" fill="none" stroke="${c.dark}" stroke-width="34" stroke-linecap="round"/>
    <rect x="190" y="520" width="110" height="190" rx="48" fill="${c.dark}"/>
    <rect x="500" y="520" width="110" height="190" rx="48" fill="${c.dark}"/>
    <rect x="215" y="550" width="40" height="130" rx="20" fill="${c.mid}" opacity=".5"/>`,
  watch: (c) => `
    <rect x="335" y="200" width="130" height="200" rx="30" fill="${c.mid}"/>
    <rect x="335" y="600" width="130" height="200" rx="30" fill="${c.mid}"/>
    <rect x="285" y="370" width="230" height="260" rx="64" fill="${c.dark}"/>
    <rect x="305" y="390" width="190" height="220" rx="48" fill="#111"/>
    <text x="400" y="515" text-anchor="middle" font-family="Helvetica,Arial" font-size="58" font-weight="300" fill="#fff">10:09</text>
    <rect x="518" y="450" width="14" height="50" rx="7" fill="${c.dark}"/>`,
  phone: (c) => `
    <rect x="280" y="210" width="240" height="500" rx="44" fill="${c.dark}"/>
    <rect x="294" y="224" width="212" height="472" rx="34" fill="#151515"/>
    <rect x="370" y="238" width="60" height="16" rx="8" fill="${c.dark}"/>
    <circle cx="400" cy="470" r="70" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>`,
  speaker: (c) => `
    <rect x="290" y="260" width="220" height="460" rx="110" fill="${c.dark}"/>
    <circle cx="400" cy="400" r="58" fill="${c.mid}"/>
    <circle cx="400" cy="400" r="22" fill="${c.dark}"/>
    <circle cx="400" cy="590" r="70" fill="${c.mid}"/>
    <circle cx="400" cy="590" r="28" fill="${c.dark}"/>`,
  sneaker: (c) => `
    <path d="M150 640 C150 560 190 520 250 500 L330 470 C360 440 380 400 400 380 C430 400 470 420 520 440 C600 470 650 500 660 560 L660 640 Z" fill="${c.dark}"/>
    <path d="M140 640 H670 V680 Q670 700 650 700 H160 Q140 700 140 680 Z" fill="#fff" stroke="${c.dark}" stroke-width="6"/>
    <path d="M330 500 L420 470 M350 530 L445 495 M370 560 L470 520" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <path d="M480 560 Q560 520 640 590" stroke="${c.mid}" stroke-width="14" fill="none" stroke-linecap="round"/>`,
  boot: (c) => `
    <path d="M300 250 H470 V560 C560 570 640 600 650 660 V690 H290 V250 Z" fill="${c.dark}"/>
    <rect x="280" y="680" width="380" height="40" rx="10" fill="${c.mid}"/>
    <path d="M330 320 H440 M330 380 H440 M330 440 H440" stroke="${c.mid}" stroke-width="10" stroke-linecap="round"/>`,
  tshirt: (c) => `
    <path d="M300 250 L210 300 L150 420 L240 460 L270 410 L270 740 H530 V410 L560 460 L650 420 L590 300 L500 250 Q400 320 300 250 Z" fill="${c.dark}"/>
    <path d="M300 250 Q400 320 500 250" fill="none" stroke="${c.mid}" stroke-width="10"/>`,
  hoodie: (c) => `
    <path d="M300 260 L200 310 L140 600 L230 620 L270 430 L270 750 H530 V430 L570 620 L660 600 L600 310 L500 260 Z" fill="${c.dark}"/>
    <path d="M300 260 Q300 170 400 170 Q500 170 500 260 Q450 330 400 330 Q350 330 300 260 Z" fill="${c.mid}"/>
    <rect x="320" y="560" width="160" height="90" rx="20" fill="none" stroke="${c.mid}" stroke-width="8"/>
    <path d="M380 330 V420 M420 330 V420" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  jacket: (c) => `
    <path d="M310 240 L200 300 L150 640 L240 650 L275 440 L275 760 H525 V440 L560 650 L650 640 L600 300 L490 240 L400 330 Z" fill="${c.dark}"/>
    <path d="M400 330 V760" stroke="${c.mid}" stroke-width="8"/>
    <path d="M310 240 L360 420 L400 330 L440 420 L490 240" fill="${c.mid}" opacity=".6"/>`,
  laptop: (c) => `
    <rect x="190" y="290" width="420" height="290" rx="18" fill="${c.dark}"/>
    <rect x="210" y="310" width="380" height="250" rx="6" fill="#151515"/>
    <path d="M130 600 H670 L640 640 H160 Z" fill="${c.mid}"/>
    <rect x="360" y="600" width="80" height="10" rx="5" fill="${c.dark}"/>`,
};

const palettes = {
  light: { bg1: "#f5f5f5", bg2: "#e5e5e5", dark: "#171717", mid: "#a3a3a3", glass: "#fafafa", text: "#737373" },
  stone: { bg1: "#e7e5e4", bg2: "#d6d3d1", dark: "#1c1917", mid: "#78716c", glass: "#f5f5f4", text: "#57534e" },
  dark: { bg1: "#262626", bg2: "#0a0a0a", dark: "#f5f5f5", mid: "#737373", glass: "#404040", text: "#a3a3a3" },
  cool: { bg1: "#f1f5f9", bg2: "#cbd5e1", dark: "#0f172a", mid: "#64748b", glass: "#f8fafc", text: "#475569" },
};

function svg(shape, paletteName, label, labelY = 900) {
  const c = palettes[paletteName];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg1}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient>
  <radialGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <ellipse cx="400" cy="770" rx="260" ry="34" fill="url(#sh)"/>
  ${shapes[shape](c)}
  <text x="400" y="${labelY}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="8" fill="${c.text}">${label}</text>
</svg>`;
}

const items = [
  ["perfume-1", "perfume", "light"], ["perfume-2", "perfume2", "stone"], ["perfume-3", "perfume", "dark"], ["perfume-4", "perfume2", "cool"],
  ["headphones-1", "headphones", "light"], ["headphones-2", "headphones", "dark"], ["watch-1", "watch", "cool"], ["phone-1", "phone", "stone"],
  ["speaker-1", "speaker", "light"], ["laptop-1", "laptop", "cool"],
  ["sneaker-1", "sneaker", "light"], ["sneaker-2", "sneaker", "dark"], ["sneaker-3", "sneaker", "stone"], ["boot-1", "boot", "stone"],
  ["tshirt-1", "tshirt", "light"], ["tshirt-2", "tshirt", "dark"], ["hoodie-1", "hoodie", "cool"], ["jacket-1", "jacket", "stone"],
];
for (const [name, shape, pal] of items) writeFileSync(`${OUT}/${name}.svg`, svg(shape, pal, "NOVASTORE · DEMO"));

const cats = [["cat-perfumes", "perfume", "dark"], ["cat-electronica", "headphones", "dark"], ["cat-zapatillas", "sneaker", "dark"], ["cat-ropa", "hoodie", "dark"]];
for (const [name, shape, pal] of cats) writeFileSync(`${OUT}/${name}.svg`, svg(shape, pal, "IMAGEN DE DEMOSTRACIÓN", 90));
console.log(`Generadas ${items.length + cats.length} imágenes en ${OUT}`);
