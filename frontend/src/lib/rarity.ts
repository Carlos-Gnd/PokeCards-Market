export type RarityTier =
  | 'core' | 'alloy' | 'prime' | 'elite' | 'apex' | 'ascendant' | 'eternal';

export interface RarityConfig {
  tier: RarityTier;
  label: string;
  textClass: string;
  borderClass: string;
  bgGlow: string;
  ringClass: string;
  badgeClass: string;
  shadow: string;
  intensity: number; // 1..7
}

export const RARITY_CONFIG: Record<RarityTier, RarityConfig> = {
  core: {
    tier: 'core', label: 'Core', intensity: 1,
    textClass: 'text-rarity-core',
    borderClass: 'border-rarity-core/40',
    bgGlow: 'from-rarity-core/15 to-transparent',
    ringClass: 'ring-rarity-core/20',
    badgeClass: 'bg-rarity-core/15 text-rarity-core border-rarity-core/30',
    shadow: 'shadow-[0_8px_24px_-12px_rgba(148,163,184,0.4)]',
  },
  alloy: {
    tier: 'alloy', label: 'Alloy', intensity: 2,
    textClass: 'text-rarity-alloy',
    borderClass: 'border-rarity-alloy/45',
    bgGlow: 'from-rarity-alloy/20 to-transparent',
    ringClass: 'ring-rarity-alloy/25',
    badgeClass: 'bg-rarity-alloy/15 text-rarity-alloy border-rarity-alloy/35',
    shadow: 'shadow-[0_10px_30px_-10px_rgba(103,232,249,0.45)]',
  },
  prime: {
    tier: 'prime', label: 'Prime', intensity: 3,
    textClass: 'text-rarity-prime',
    borderClass: 'border-rarity-prime/55',
    bgGlow: 'from-rarity-prime/25 to-transparent',
    ringClass: 'ring-rarity-prime/30',
    badgeClass: 'bg-rarity-prime/15 text-rarity-prime border-rarity-prime/40',
    shadow: 'shadow-[0_12px_36px_-12px_rgba(53,200,255,0.55)]',
  },
  elite: {
    tier: 'elite', label: 'Elite', intensity: 4,
    textClass: 'text-rarity-elite',
    borderClass: 'border-rarity-elite/60',
    bgGlow: 'from-rarity-elite/30 to-transparent',
    ringClass: 'ring-rarity-elite/35',
    badgeClass: 'bg-rarity-elite/20 text-rarity-elite border-rarity-elite/50',
    shadow: 'shadow-[0_16px_40px_-14px_rgba(167,139,250,0.6)]',
  },
  apex: {
    tier: 'apex', label: 'Apex', intensity: 5,
    textClass: 'text-rarity-apex',
    borderClass: 'border-rarity-apex/70',
    bgGlow: 'from-rarity-apex/40 to-transparent',
    ringClass: 'ring-rarity-apex/45',
    badgeClass: 'bg-rarity-apex/25 text-white border-rarity-apex/60',
    shadow: 'shadow-glow-primary',
  },
  ascendant: {
    tier: 'ascendant', label: 'Ascendant', intensity: 6,
    textClass: 'text-rarity-ascendant',
    borderClass: 'border-rarity-ascendant/80',
    bgGlow: 'from-rarity-ascendant/45 to-transparent',
    ringClass: 'ring-rarity-ascendant/50',
    badgeClass: 'bg-rarity-ascendant/25 text-rarity-ascendant border-rarity-ascendant/70',
    shadow: 'shadow-glow-gold',
  },
  eternal: {
    tier: 'eternal', label: 'Eternal', intensity: 7,
    textClass: 'text-rarity-eternal',
    borderClass: 'border-rarity-eternal/90',
    bgGlow: 'from-rarity-eternal/55 to-transparent',
    ringClass: 'ring-rarity-eternal/60',
    badgeClass: 'bg-rarity-eternal/30 text-rarity-eternal border-rarity-eternal/80',
    shadow: 'shadow-glow-eternal',
  },
};

export function getRarityConfig(rarity: string): RarityConfig {
  return RARITY_CONFIG[(rarity as RarityTier)] ?? RARITY_CONFIG.core;
}

export const VARIANT_LABEL: Record<string, string> = {
  standard: 'Standard',
  luminous: 'Luminous',
  signature: 'Signature',
  prestige: 'Prestige',
  spectrum: 'Spectrum',
  vaulted: 'Vaulted',
};

// Colores por tipo Pokémon (no rareza, sino tipo elemental)
export const TYPE_COLOR: Record<string, string> = {
  Fire: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
  Water: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
  Electric: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  Grass: 'bg-green-500/20 text-green-300 border-green-400/40',
  Ice: 'bg-cyan-400/20 text-cyan-200 border-cyan-300/40',
  Fighting: 'bg-red-700/20 text-red-300 border-red-600/40',
  Poison: 'bg-purple-600/20 text-purple-300 border-purple-500/40',
  Ground: 'bg-amber-700/20 text-amber-300 border-amber-600/40',
  Flying: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40',
  Psychic: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
  Bug: 'bg-lime-600/20 text-lime-300 border-lime-500/40',
  Rock: 'bg-stone-500/20 text-stone-300 border-stone-400/40',
  Ghost: 'bg-violet-700/20 text-violet-300 border-violet-500/40',
  Dragon: 'bg-indigo-700/20 text-indigo-200 border-indigo-500/40',
  Dark: 'bg-zinc-700/30 text-zinc-200 border-zinc-500/40',
  Steel: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
  Fairy: 'bg-rose-400/20 text-rose-200 border-rose-300/40',
  Normal: 'bg-neutral-500/20 text-neutral-200 border-neutral-400/40',
};

export function getTypeColor(type: string): string {
  return TYPE_COLOR[type] ?? TYPE_COLOR.Normal;
}
