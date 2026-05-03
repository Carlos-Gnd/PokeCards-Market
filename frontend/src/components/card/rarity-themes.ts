/**
 * Temas visuales por rareza ARCADIUM.
 * Cada rareza tiene una identidad radicalmente distinta:
 * desde minimalista (CORE) hasta hiper-premium (ETERNAL).
 */

import type { RarityTier } from '../../lib/rarity';

export interface RarityTheme {
  tier: RarityTier;
  label: string;
  /** Borde principal del frame (CSS gradient o color). */
  frameBorder: string;
  /** Fondo principal del card. */
  frameBg: string;
  /** Color de texto del nombre. */
  nameColor: string;
  /** Sombra base del card. */
  cardShadow: string;
  /** Sombra de glow ambient. */
  glowShadow: string;
  /** Texto pequeño / metadata. */
  metaColor: string;
  /** Color del HP. */
  accentColor: string;

  /** Capas activas para esta rareza. */
  layers: {
    /** Holo: textura holográfica iridiscente. */
    holo?: 'subtle' | 'partial' | 'full' | 'rainbow';
    /** Foil: foil multicolor moviéndose. */
    foil?: 'metallic' | 'rainbow' | 'prismatic';
    /** Particles: chispas decorativas. */
    particles?: 'sparse' | 'medium' | 'dense' | 'ring';
    /** Glow constante (no solo en hover). */
    ambientGlow?: boolean;
    /** Rays: rayos detrás del artwork. */
    rays?: boolean;
    /** Breathing aura (animación de respirar). */
    breathing?: boolean;
    /** Slab/encapsulation visual (PSA-style). */
    slab?: boolean;
    /** Shimmer estático (sweep horizontal). */
    shimmer?: 'slow' | 'constant';
  };
  /** Tilt máximo en grados. */
  tiltMaxDeg: number;
  /** Intensidad multiplicador del tilt. */
  tiltIntensity: number;
  /** Hover lift en px. */
  hoverLift: number;
}

export const RARITY_THEMES: Record<RarityTier, RarityTheme> = {
  // 1. CORE — minimalista, gris oscuro, sin glow
  core: {
    tier: 'core',
    label: 'Core',
    frameBorder: 'linear-gradient(135deg, #2a3144 0%, #1f2538 100%)',
    frameBg: 'linear-gradient(180deg, #1A2138 0%, #141B34 100%)',
    nameColor: '#E5E7EB',
    cardShadow: '0 8px 24px -10px rgba(0,0,0,0.5)',
    glowShadow: '0 0 0 transparent',
    metaColor: '#94A3B8',
    accentColor: '#94A3B8',
    layers: {},
    tiltMaxDeg: 6,
    tiltIntensity: 0.6,
    hoverLift: 4,
  },

  // 2. ALLOY — cian metálico, ligero brillo
  alloy: {
    tier: 'alloy',
    label: 'Alloy',
    frameBorder: 'linear-gradient(135deg, #67E8F9 0%, #5EEAD4 100%)',
    frameBg: 'linear-gradient(180deg, #112E2C 0%, #0F2530 100%)',
    nameColor: '#A7F3D0',
    cardShadow: '0 10px 28px -10px rgba(103,232,249,0.3)',
    glowShadow: '0 0 24px rgba(103,232,249,0.35)',
    metaColor: '#67E8F9',
    accentColor: '#67E8F9',
    layers: { shimmer: 'slow', ambientGlow: true },
    tiltMaxDeg: 8,
    tiltIntensity: 0.8,
    hoverLift: 6,
  },

  // 3. PRIME — azul premium, brillo radial interno
  prime: {
    tier: 'prime',
    label: 'Prime',
    frameBorder: 'linear-gradient(135deg, #35C8FF 0%, #6DDBFF 50%, #35C8FF 100%)',
    frameBg: 'radial-gradient(circle at 50% 30%, #0B2E4D 0%, #0B1B36 70%)',
    nameColor: '#BAE6FD',
    cardShadow: '0 14px 36px -12px rgba(53,200,255,0.45)',
    glowShadow: '0 0 32px rgba(53,200,255,0.5)',
    metaColor: '#7DD3FC',
    accentColor: '#35C8FF',
    layers: { shimmer: 'slow', ambientGlow: true, holo: 'subtle' },
    tiltMaxDeg: 10,
    tiltIntensity: 0.9,
    hoverLift: 8,
  },

  // 4. ELITE — púrpura premium, holo parcial, glow pulsante
  elite: {
    tier: 'elite',
    label: 'Elite',
    frameBorder: 'linear-gradient(135deg, #A78BFA 0%, #6D5EF8 50%, #A78BFA 100%)',
    frameBg: 'radial-gradient(circle at 50% 30%, #2D1B5C 0%, #1A1342 70%)',
    nameColor: '#DDD6FE',
    cardShadow: '0 18px 44px -14px rgba(167,139,250,0.55)',
    glowShadow: '0 0 38px rgba(167,139,250,0.55)',
    metaColor: '#C4B5FD',
    accentColor: '#A78BFA',
    layers: { holo: 'partial', shimmer: 'slow', ambientGlow: true, breathing: true },
    tiltMaxDeg: 14,
    tiltIntensity: 1,
    hoverLift: 10,
  },

  // 5. APEX — dorado, rayos detrás, aura
  apex: {
    tier: 'apex',
    label: 'Apex',
    frameBorder: 'linear-gradient(135deg, #F6C453 0%, #FFD876 30%, #F6C453 60%, #B8860B 100%)',
    frameBg: 'radial-gradient(circle at 50% 25%, #3A2510 0%, #1A1107 70%)',
    nameColor: '#FFD876',
    cardShadow: '0 22px 50px -16px rgba(246,196,83,0.6)',
    glowShadow: '0 0 44px rgba(246,196,83,0.65)',
    metaColor: '#FCD34D',
    accentColor: '#F6C453',
    layers: { rays: true, particles: 'sparse', shimmer: 'constant', ambientGlow: true, breathing: true, holo: 'partial' },
    tiltMaxDeg: 16,
    tiltIntensity: 1.1,
    hoverLift: 14,
  },

  // 6. ASCENDANT — blanco + cyan + gold mix, holo full surface
  ascendant: {
    tier: 'ascendant',
    label: 'Ascendant',
    frameBorder: 'linear-gradient(135deg, #ffffff 0%, #35C8FF 30%, #F6C453 60%, #ffffff 100%)',
    frameBg: 'radial-gradient(circle at 50% 25%, #1B2547 0%, #0B1020 70%)',
    nameColor: '#ffffff',
    cardShadow: '0 26px 58px -18px rgba(53,200,255,0.55)',
    glowShadow: '0 0 52px rgba(53,200,255,0.6)',
    metaColor: '#E0F2FE',
    accentColor: '#35C8FF',
    layers: { holo: 'full', foil: 'rainbow', particles: 'medium', ambientGlow: true, breathing: true, rays: true },
    tiltMaxDeg: 18,
    tiltIntensity: 1.2,
    hoverLift: 16,
  },

  // 7. ETERNAL — obsidiana + oro + prismático
  eternal: {
    tier: 'eternal',
    label: 'Eternal',
    frameBorder: 'linear-gradient(135deg, #FF6FB5 0%, #6D5EF8 25%, #35C8FF 50%, #F6C453 75%, #FF6FB5 100%)',
    frameBg: 'radial-gradient(circle at 50% 25%, #1a0a2e 0%, #050510 80%)',
    nameColor: '#FF6FB5',
    cardShadow: '0 32px 70px -20px rgba(255,111,181,0.7)',
    glowShadow: '0 0 64px rgba(255,111,181,0.75)',
    metaColor: '#FBCFE8',
    accentColor: '#FF6FB5',
    layers: { holo: 'rainbow', foil: 'prismatic', particles: 'ring', ambientGlow: true, breathing: true, rays: true, shimmer: 'constant' },
    tiltMaxDeg: 20,
    tiltIntensity: 1.4,
    hoverLift: 20,
  },
};

export function getTheme(rarity: string): RarityTheme {
  return RARITY_THEMES[(rarity as RarityTier)] ?? RARITY_THEMES.core;
}
