/**
 * Sistema oficial de rarezas ARCADIUM (Documento-Maestro §12, §13, §17).
 * Determinismo: la rareza y variante se derivan del pokemon_id para que
 * cada Pokémon mantenga la misma rareza entre cargas.
 */

export type RarityTier =
  | 'core'
  | 'alloy'
  | 'prime'
  | 'elite'
  | 'apex'
  | 'ascendant'
  | 'eternal';

export type CardVariant =
  | 'standard'
  | 'luminous'
  | 'signature'
  | 'prestige'
  | 'spectrum'
  | 'vaulted';

export interface RarityDef {
  tier: RarityTier;
  label: string;
  dropRate: number;
  basePrice: number;
}

// §12 + §17 del Documento-Maestro
export const RARITY_TABLE: RarityDef[] = [
  { tier: 'core', label: 'Core', dropRate: 50.0, basePrice: 1 },
  { tier: 'alloy', label: 'Alloy', dropRate: 25.0, basePrice: 2 },
  { tier: 'prime', label: 'Prime', dropRate: 12.0, basePrice: 4 },
  { tier: 'elite', label: 'Elite', dropRate: 7.0, basePrice: 8 },
  { tier: 'apex', label: 'Apex', dropRate: 4.0, basePrice: 15 },
  { tier: 'ascendant', label: 'Ascendant', dropRate: 1.8, basePrice: 25 },
  { tier: 'eternal', label: 'Eternal', dropRate: 0.2, basePrice: 50 },
];

export const VARIANTS: { variant: CardVariant; label: string }[] = [
  { variant: 'standard', label: 'Standard' },
  { variant: 'luminous', label: 'Luminous' },
  { variant: 'signature', label: 'Signature' },
  { variant: 'prestige', label: 'Prestige' },
  { variant: 'spectrum', label: 'Spectrum' },
  { variant: 'vaulted', label: 'Vaulted' },
];

/** Pokémon icónicos forzados a tier alto (legendarios/míticos = Eternal/Ascendant). */
const FORCED_TIERS: Record<number, RarityTier> = {
  // Eternal (legendarios míticos)
  151: 'eternal', // Mew
  150: 'eternal', // Mewtwo
  144: 'ascendant', // Articuno
  145: 'ascendant', // Zapdos
  146: 'ascendant', // Moltres
  149: 'ascendant', // Dragonite
  130: 'apex', // Gyarados
  6: 'apex', // Charizard
  9: 'apex', // Blastoise
  3: 'apex', // Venusaur
  248: 'apex', // Tyranitar
  // Apex extra
  94: 'elite', // Gengar
  131: 'elite', // Lapras
  143: 'elite', // Snorlax
  142: 'elite', // Aerodactyl
  // Iconos
  25: 'prime', // Pikachu (carismático pero base)
  26: 'elite', // Raichu
  133: 'prime', // Eevee
};

/** Hash determinista 0..1 a partir de un entero. */
function det01(seed: number): number {
  // Mulberry32-like
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Variante determinística según la rareza (mejores rarezas tienden a variantes más raras). */
export function variantFor(pokemonId: number, tier: RarityTier): CardVariant {
  const roll = det01(pokemonId * 7919 + 1031);
  if (tier === 'eternal') return 'prestige';
  if (tier === 'ascendant') return roll < 0.5 ? 'spectrum' : 'signature';
  if (tier === 'apex') return roll < 0.4 ? 'signature' : 'luminous';
  if (tier === 'elite') return roll < 0.5 ? 'luminous' : 'standard';
  if (tier === 'prime') return roll < 0.3 ? 'luminous' : 'standard';
  return 'standard';
}

/** Multiplicador de precio por variante. */
const VARIANT_MULT: Record<CardVariant, number> = {
  standard: 1.0,
  luminous: 1.4,
  signature: 1.8,
  prestige: 2.5,
  spectrum: 2.2,
  vaulted: 3.0,
};

/** Precio final (USD) determinístico para una carta. */
export function priceFor(pokemonId: number, tier: RarityTier, variant: CardVariant): number {
  const base = RARITY_TABLE.find((r) => r.tier === tier)!.basePrice;
  const noise = 0.85 + det01(pokemonId * 31337 + 17) * 0.3; // 0.85..1.15
  return Math.round(base * VARIANT_MULT[variant] * noise * 100) / 100;
}
