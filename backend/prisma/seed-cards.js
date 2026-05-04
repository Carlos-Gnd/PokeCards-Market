// Seed script — inserta cartas de múltiples expansiones en cartas_pokemon.
// Uso: node prisma/seed-cards.js
// Requiere que DATABASE_URL esté en backend/.env

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Precio base por rareza (sin datos TCGPlayer)
const RARITY_BASE = {
  Common:                         0.50,
  Uncommon:                       1.00,
  Rare:                           2.00,
  'Rare Holo':                    3.00,
  'Rare Holo EX':                 5.00,
  'Rare Holo LV.X':               5.00,
  'Rare Holo Star':               8.00,
  'Rare BREAK':                   4.00,
  'LEGEND':                       8.00,
  'Rare Prism Star':              6.00,
  'Rare Shiny':                   5.00,
  'Rare Shiny GX':               12.00,
  'Rare Ultra':                   8.00,
  'Rare Secret':                 15.00,
  'Rare Rainbow':                18.00,
  'Amazing Rare':                 6.00,
  'Double Rare':                  4.00,
  'Ultra Rare':                   8.00,
  'Illustration Rare':           10.00,
  'Special Illustration Rare':   20.00,
  'Hyper Rare':                  25.00,
};

// Hash determinista 0..1 (Mulberry32-like) para noise de precio
function det01(seed) {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function priceFor(rarity, cardId) {
  const base = RARITY_BASE[rarity] ?? 1.00;
  const noise = 0.85 + det01(hashString(cardId) * 31337 + 17) * 0.30;
  return Math.round(base * noise * 100) / 100;
}

// Archivos JSON — rutas relativas al repo root (dos niveles arriba de prisma/)
const JSON_FILES = [
  path.resolve(__dirname, '../../../base1.json'),
  path.resolve(__dirname, '../../../swsh7.json'),
  path.resolve(__dirname, '../../../swsh12pt5.json'),
  path.resolve(__dirname, '../../../sv4pt5.json'),
];

async function seedFile(filePath) {
  const filename = path.basename(filePath);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const cards = JSON.parse(raw);

  let inserted = 0;
  let skipped = 0;

  for (const card of cards) {
    const id = card.id;
    const nombre = card.name;
    const pokedexNumero = (card.nationalPokedexNumbers?.[0]) ?? null;
    const rareza = card.rarity ?? null;
    const tipo = card.types?.[0] ?? null;
    const imagenSmall = card.images?.small ?? null;
    const imagenLarge = card.images?.large ?? null;
    const precioMercado = priceFor(rareza, id);

    try {
      const result = await prisma.$executeRaw`
        INSERT INTO cartas_pokemon
          (id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado)
        VALUES
          (${id}, ${nombre}, ${pokedexNumero}, ${rareza}, ${tipo},
           ${imagenSmall}, ${imagenLarge}, ${precioMercado})
        ON CONFLICT (id) DO NOTHING
      `;
      if (result === 1) inserted++;
      else skipped++;
    } catch (err) {
      console.error(`  ERROR en ${id}: ${err.message}`);
    }
  }

  console.log(`${filename}: ${inserted} insertadas, ${skipped} ya existían`);
}

async function main() {
  console.log('Conectando a Supabase…');
  for (const file of JSON_FILES) {
    if (!fs.existsSync(file)) {
      console.warn(`  SKIP — no encontrado: ${file}`);
      continue;
    }
    await seedFile(file);
  }
  console.log('Seed completado.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
