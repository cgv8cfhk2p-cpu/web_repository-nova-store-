// Países a los que se puede enviar. Solo se ofrecen en el checkout los que tengan una tarifa de envío activa.
export const COUNTRIES: Record<string, string> = {
  ES: "España",
  PT: "Portugal",
  FR: "Francia",
  IT: "Italia",
  DE: "Alemania",
  BE: "Bélgica",
  NL: "Países Bajos",
  LU: "Luxemburgo",
  AT: "Austria",
  IE: "Irlanda",
  PL: "Polonia",
  CZ: "Chequia",
  SE: "Suecia",
  DK: "Dinamarca",
  FI: "Finlandia",
  GR: "Grecia",
  RO: "Rumanía",
  HU: "Hungría",
  SK: "Eslovaquia",
  SI: "Eslovenia",
  HR: "Croacia",
  BG: "Bulgaria",
  EE: "Estonia",
  LV: "Letonia",
  LT: "Lituania",
  CY: "Chipre",
  MT: "Malta",
  AD: "Andorra",
  GB: "Reino Unido",
  CH: "Suiza",
};

export const ES_PROVINCES = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos",
  "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada",
  "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Illes Balears", "Jaén", "La Rioja", "Las Palmas", "León",
  "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia",
  "Valladolid", "Bizkaia", "Zamora", "Zaragoza", "Ceuta", "Melilla",
];

export function countryName(code: string): string {
  return COUNTRIES[code] ?? code;
}
