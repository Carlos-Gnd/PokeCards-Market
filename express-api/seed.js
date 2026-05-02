'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const RARITY_FALLBACK_PRICE_USD = {
  Common: 0.1,
  Uncommon: 0.25,
  Rare: 0.75,
  'Double Rare': 2.5,
  'Ultra Rare': 8.0,
  'Illustration Rare': 12.0,
  'Special Illustration Rare': 45.0,
  'Hyper Rare': 35.0,
};

function extractMarketPrice(card) {
  const prices = card?.tcgplayer?.prices;
  if (prices && typeof prices === 'object') {
    const variants = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil', '1stEditionNormal'];
    for (const v of variants) {
      const variant = prices[v];
      if (variant) {
        const value = variant.market ?? variant.mid ?? variant.high ?? variant.low;
        if (typeof value === 'number' && Number.isFinite(value)) return value;
      }
    }
  }
  const fallback = RARITY_FALLBACK_PRICE_USD[card?.rarity];
  return typeof fallback === 'number' ? fallback : 0;
}

async function main() {
  const jsonPath = process.env.CARDS_JSON_PATH;
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    throw new Error(`CARDS_JSON_PATH no apunta a un archivo válido: ${jsonPath}`);
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definido en el entorno');
  }

  console.log(`[seed] Leyendo ${path.basename(jsonPath)}...`);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const cards = JSON.parse(raw);
  if (!Array.isArray(cards)) throw new Error('Se esperaba un array de cartas en el JSON');
  console.log(`[seed] ${cards.length} cartas detectadas`);

  const connectionString = process.env.DATABASE_URL.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('[seed] Conectado a Postgres');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cartas_pokemon (
        id VARCHAR(64) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        pokedex_numero INT,
        rareza VARCHAR(64),
        tipo VARCHAR(32),
        imagen_small VARCHAR(512),
        imagen_large VARCHAR(512),
        precio_mercado DECIMAL(10,2) NOT NULL DEFAULT 0
      );
    `);
    await client.query(`ALTER TABLE cartas_pokemon ADD COLUMN IF NOT EXISTS tipo VARCHAR(32)`);
    console.log('[seed] Tabla cartas_pokemon lista');

    const insertSql = `
      INSERT INTO cartas_pokemon
        (id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        rareza = EXCLUDED.rareza,
        precio_mercado = EXCLUDED.precio_mercado
    `;

    let inserted = 0;
    let skipped = 0;
    for (const card of cards) {
      const id = card.id;
      const nombre = card.name ?? 'Unknown';
      const pokedexNumero = Array.isArray(card.nationalPokedexNumbers) && card.nationalPokedexNumbers.length
        ? card.nationalPokedexNumbers[0]
        : null;
      const rareza = card.rarity ?? null;
      const tipo = Array.isArray(card.types) && card.types.length ? card.types[0] : null;
      const imagenSmall = card.images?.small ?? null;
      const imagenLarge = card.images?.large ?? null;
      const precio = extractMarketPrice(card);

      const result = await client.query(insertSql, [
        id, nombre, pokedexNumero, rareza, tipo, imagenSmall, imagenLarge, precio.toFixed(2),
      ]);
      if (result.rowCount === 1) inserted += 1;
      else skipped += 1;
    }

    const { rows } = await client.query('SELECT COUNT(*)::int AS total FROM cartas_pokemon');
    console.log(`[seed] Insertadas: ${inserted}, ya existentes: ${skipped}, total en tabla: ${rows[0].total}`);
  } finally {
    await client.end();
    console.log('[seed] Conexión cerrada');
  }
}

main().catch((err) => {
  console.error('[seed] Error:', err.message);
  process.exit(1);
});
