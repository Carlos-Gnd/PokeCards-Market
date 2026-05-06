// ── backend/prisma/seed-cards.js — v2.0 ──────────────────────────────────────
// Inserta cartas en la tabla `cards` (Prisma SSOT) con STATS REALES de PokéAPI.
// Uso: node prisma/seed-cards.js
// Requiere que DATABASE_URL esté en backend/.env

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ── 1. UTILIDADES Y PRECIOS BASE ──────────────────────────────────────────────
const RARITY_BASE = {
  Common: 0.5,
  Uncommon: 1.0,
  Rare: 2.0,
  'Rare Holo': 3.0,
  'Rare Holo EX': 5.0,
  'Rare Holo LV.X': 5.0,
  'Rare Holo Star': 8.0,
  'Rare BREAK': 4.0,
  LEGEND: 8.0,
  'Rare Prism Star': 6.0,
  'Rare Shiny': 5.0,
  'Rare Shiny GX': 12.0,
  'Rare Ultra': 8.0,
  'Rare Secret': 15.0,
  'Rare Rainbow': 18.0,
  'Amazing Rare': 6.0,
  'Double Rare': 4.0,
  'Ultra Rare': 8.0,
  'Illustration Rare': 10.0,
  'Special Illustration Rare': 20.0,
  'Hyper Rare': 25.0,
};

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

function det01(seed) {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function priceFor(rarity, cardId) {
  const base = RARITY_BASE[rarity] || 1.0;
  const noise = 0.85 + det01(hashString(cardId) * 31337 + 17) * 0.3;
  return Math.round(base * noise * 100) / 100;
}

function variantFor(cardId, rarity) {
  const roll = det01(hashString(cardId) * 7919);
  if (rarity === 'Hyper Rare') return 'prestige';
  if (rarity === 'Special Illustration Rare')
    return roll < 0.5 ? 'spectrum' : 'signature';
  if (rarity === 'Illustration Rare' || rarity === 'Ultra Rare')
    return roll < 0.4 ? 'signature' : 'luminous';
  return 'standard';
}

function setIdFrom(cardId) {
  const parts = cardId.split('-');
  return parts.length > 1 ? parts.slice(0, -1).join('-') : cardId;
}

function pokemonIdFrom(cardId) {
  const tail = cardId.split('-').pop();
  const n = parseInt(tail ?? '', 10);
  return Number.isFinite(n) ? n : 0;
}

// ── 2. INTEGRACIÓN CON POKÉAPI (STATS REALES) ────────────────────────────────
const statsCache = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getRealStats(pokemonId) {
  if (!pokemonId) return { hp: 50, attack: 50, defense: 50, speed: 50 };

  // Si ya consultamos a este Pokémon antes, usamos la memoria (súper rápido)
  if (statsCache[pokemonId]) return statsCache[pokemonId];

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!res.ok) {
      if (res.status === 404)
        return { hp: 50, attack: 50, defense: 50, speed: 50 };
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    const getStat = (name) =>
      data.stats.find((s) => s.stat.name === name)?.base_stat || 50;
    const stats = {
      hp: getStat('hp'),
      attack: getStat('attack'),
      defense: getStat('defense'),
      speed: getStat('speed'),
    };

    statsCache[pokemonId] = stats; // Guardamos en caché
    await sleep(40); // Pausa obligatoria para no saturar los servidores de PokéAPI
    return stats;
  } catch (err) {
    console.warn(
      `\n  ⚠️ Fallo al obtener stats del Pokémon #${pokemonId}: ${err.message}`,
    );
    return { hp: 50, attack: 50, defense: 50, speed: 50 };
  }
}

// ── 3. ARCHIVOS JSON DE EXPANSIONES ──────────────────────────────────────────
const JSON_FILES = [
  path.resolve(__dirname, '../../base1.json'),       // Base Set 
  path.resolve(__dirname, '../../base3.json'),       // Fossil 
  path.resolve(__dirname, '../../sv3.json'),         // Obsidian Flames 
  path.resolve(__dirname, '../../sv3pt5.json'),      // Pokémon 151 
  path.resolve(__dirname, '../../sv4pt5.json'),      // Paldean Fates 
  path.resolve(__dirname, '../../sv8.json'),         // Surging Sparks 
  path.resolve(__dirname, '../../sv8pt5.json'),      // Prismatic Evolutions 
  path.resolve(__dirname, '../../swsh7.json'),       // Evolving Skies 
  path.resolve(__dirname, '../../swsh12pt5.json'),   // Crown Zenith 
];

// ── 4. LÓGICA PRINCIPAL DE INSERCIÓN ─────────────────────────────────────────
async function seedFile(filePath) {
  const filename = path.basename(filePath);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const cards = JSON.parse(raw);

  console.log(`\n📦 Procesando ${filename} (${cards.length} cartas)...`);
  let inserted = 0;
  let skipped = 0;

  for (const card of cards) {
    const tcgId = card.id;
    const pokemonId = card.nationalPokedexNumbers?.[0] ?? pokemonIdFrom(tcgId);
    const setId = card.set?.id ?? setIdFrom(tcgId);
    const name = card.name;

    // ✅ FIX: Guardamos el string original (ej. 'Illustration Rare') para que el backend lo mapee bien
    const rarity = card.rarity ?? 'Common';
    const type = card.types?.[0] ?? 'Colorless';
    const secondaryType = card.types?.[1] ?? null;
    const imageUrl = card.images?.large ?? card.images?.small ?? '';
    const marketPrice = priceFor(rarity, tcgId);
    const variant = variantFor(tcgId, rarity);

    // 🔥 Magia: Obtenemos los stats reales de los juegos!
    const stats = await getRealStats(pokemonId);

    try {
      await prisma.card.upsert({
        where: { tcgId },
        update: {
          name,
          pokemonId,
          setId,
          type,
          secondaryType,
          rarity,
          variant,
          imageUrl,
          marketPrice,
          hp: stats.hp,
          attack: stats.attack,
          defense: stats.defense,
          speed: stats.speed,
        },
        create: {
          tcgId,
          name,
          pokemonId,
          setId,
          type,
          secondaryType,
          rarity,
          variant,
          imageUrl,
          marketPrice,
          hp: stats.hp,
          attack: stats.attack,
          defense: stats.defense,
          speed: stats.speed,
        },
      });
      inserted++;
      // Imprime un puntito cada 25 cartas para mostrar progreso sin llenar la consola
      if (inserted % 25 === 0) process.stdout.write('.');
    } catch (err) {
      skipped++;
      if (process.env.SEED_VERBOSE) {
        console.error(`\n❌ ERROR insertando ${tcgId}: ${err.message}`);
      }
    }
  }
  console.log(
    `\n✅ ${filename}: ${inserted} insertadas/actualizadas | ${skipped} omitidas`,
  );
}

async function main() {
  console.log('🚀 Iniciando proceso de Seed v2.0 (Prisma + PokéAPI Real)...');
  for (const file of JSON_FILES) {
    if (!fs.existsSync(file)) {
      console.warn(`\n⚠️ OMITIDO — archivo no encontrado: ${file}`);
      continue;
    }
    await seedFile(file);
  }
  console.log(
    '\n🎉 ¡Seed completado exitosamente! Tu catálogo ahora tiene stats reales de Nintendo.',
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
