/**
 * PokéCards Market — Temas visuales por rareza
 *
 * Nueva paleta basada en el diseño de marca:
 *   Primary:   Azul eléctrico  #3B82F6
 *   Secondary: Morado neón     #8B5CF6
 *   Accent:    Cian brillante  #22D3EE
 *   Gold:      Ámbar           #F59E0B
 *   Eternal:   Rosa neón       #EC4899
 */

import type { RarityTier } from '../../lib/rarity';

export interface RarityTheme {
  tier: RarityTier;
  label: string;
  frameBorder: string;
  frameBg: string;
  nameColor: string;
  cardShadow: string;
  glowShadow: string;
  metaColor: string;
  accentColor: string;
  layers: {
    holo?: 'subtle' | 'partial' | 'full' | 'rainbow';
    foil?: 'metallic' | 'rainbow' | 'prismatic';
    particles?: 'sparse' | 'medium' | 'dense' | 'ring';
    ambientGlow?: boolean;
    rays?: boolean;
    breathing?: boolean;
    slab?: boolean;
    shimmer?: 'slow' | 'constant';
  };
  tiltMaxDeg: number;
  tiltIntensity: number;
  hoverLift: number;
  luminousOverlay?: string;
}

export const RARITY_THEMES: Record<RarityTier, RarityTheme> = {

  // 1. CORE — gris frío, minimalista
  core: {
    tier: 'core',
    label: 'Core',
    frameBorder: 'linear-gradient(135deg, #2A3550 0%, #1E293B 100%)',
    frameBg: 'linear-gradient(180deg, #1A2035 0%, #131929 100%)',
    nameColor: '#E2E8F0',
    cardShadow: '0 8px 24px -10px rgba(0,0,0,0.55)',
    glowShadow: '0 0 0 transparent',
    metaColor: '#94A3B8',
    accentColor: '#94A3B8',
    layers: {},
    tiltMaxDeg: 5,
    tiltIntensity: 0.55,
    hoverLift: 4,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(148,163,184,0.14) 0%, transparent 60%)',
  },

  // 2. ALLOY — cian eléctrico
  alloy: {
    tier: 'alloy',
    label: 'Alloy',
    frameBorder: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
    frameBg: 'linear-gradient(180deg, #0E2A30 0%, #0A1F26 100%)',
    nameColor: '#A5F3FC',
    cardShadow: '0 10px 28px -10px rgba(34,211,238,0.30)',
    glowShadow: '0 0 22px rgba(34,211,238,0.38)',
    metaColor: '#67E8F9',
    accentColor: '#22D3EE',
    layers: { shimmer: 'slow', ambientGlow: true },
    tiltMaxDeg: 8,
    tiltIntensity: 0.75,
    hoverLift: 6,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 65%)',
  },

  // 3. PRIME — azul eléctrico
  prime: {
    tier: 'prime',
    label: 'Prime',
    frameBorder: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #3B82F6 100%)',
    frameBg: 'radial-gradient(circle at 50% 30%, #0E2545 0%, #091530 70%)',
    nameColor: '#BFDBFE',
    cardShadow: '0 14px 36px -12px rgba(59,130,246,0.45)',
    glowShadow: '0 0 32px rgba(59,130,246,0.50)',
    metaColor: '#93C5FD',
    accentColor: '#3B82F6',
    layers: { shimmer: 'slow', ambientGlow: true, holo: 'subtle' },
    tiltMaxDeg: 10,
    tiltIntensity: 0.88,
    hoverLift: 8,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.22) 0%, transparent 65%)',
  },

  // 4. ELITE — morado neón
  elite: {
    tier: 'elite',
    label: 'Elite',
    frameBorder: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #8B5CF6 100%)',
    frameBg: 'radial-gradient(circle at 50% 30%, #2E1B52 0%, #190F38 70%)',
    nameColor: '#DDD6FE',
    cardShadow: '0 18px 44px -14px rgba(139,92,246,0.55)',
    glowShadow: '0 0 36px rgba(139,92,246,0.55)',
    metaColor: '#C4B5FD',
    accentColor: '#8B5CF6',
    layers: { holo: 'partial', shimmer: 'slow', ambientGlow: true, breathing: true },
    tiltMaxDeg: 13,
    tiltIntensity: 1.0,
    hoverLift: 10,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.25) 0%, transparent 65%)',
  },

  // 5. APEX — dorado ámbar
  apex: {
    tier: 'apex',
    label: 'Apex',
    frameBorder: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 35%, #F59E0B 65%, #D97706 100%)',
    frameBg: 'radial-gradient(circle at 50% 25%, #3A2508 0%, #1A1005 70%)',
    nameColor: '#FDE68A',
    cardShadow: '0 22px 50px -16px rgba(245,158,11,0.60)',
    glowShadow: '0 0 44px rgba(245,158,11,0.65)',
    metaColor: '#FCD34D',
    accentColor: '#F59E0B',
    layers: { rays: true, particles: 'sparse', shimmer: 'constant', ambientGlow: true, breathing: true, holo: 'partial' },
    tiltMaxDeg: 15,
    tiltIntensity: 1.1,
    hoverLift: 13,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.28) 0%, transparent 65%)',
  },

  // 6. ASCENDANT — blanco cristal + azul + cian
  ascendant: {
    tier: 'ascendant',
    label: 'Ascendant',
    frameBorder: 'linear-gradient(135deg, #F8FAFC 0%, #3B82F6 30%, #22D3EE 60%, #F8FAFC 100%)',
    frameBg: 'radial-gradient(circle at 50% 25%, #1A2845 0%, #0B1020 70%)',
    nameColor: '#FFFFFF',
    cardShadow: '0 26px 58px -18px rgba(59,130,246,0.55)',
    glowShadow: '0 0 52px rgba(34,211,238,0.60)',
    metaColor: '#E0F2FE',
    accentColor: '#22D3EE',
    layers: { holo: 'full', foil: 'rainbow', particles: 'medium', ambientGlow: true, breathing: true, rays: true },
    tiltMaxDeg: 18,
    tiltIntensity: 1.2,
    hoverLift: 16,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(248,250,252,0.18) 0%, rgba(34,211,238,0.12) 45%, transparent 70%)',
  },

  // 7. ETERNAL — rosa neón + azul + morado
  eternal: {
    tier: 'eternal',
    label: 'Eternal',
    frameBorder: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 25%, #3B82F6 50%, #22D3EE 75%, #EC4899 100%)',
    frameBg: 'radial-gradient(circle at 50% 25%, #250A1E 0%, #06050F 80%)',
    nameColor: '#FBCFE8',
    cardShadow: '0 32px 70px -20px rgba(236,72,153,0.70)',
    glowShadow: '0 0 64px rgba(236,72,153,0.75)',
    metaColor: '#F9A8D4',
    accentColor: '#EC4899',
    layers: { holo: 'rainbow', foil: 'prismatic', particles: 'ring', ambientGlow: true, breathing: true, rays: true, shimmer: 'constant' },
    tiltMaxDeg: 20,
    tiltIntensity: 1.4,
    hoverLift: 20,
    luminousOverlay: 'radial-gradient(circle at 50% 0%, rgba(236,72,153,0.28) 0%, rgba(139,92,246,0.15) 45%, transparent 70%)',
  },
};

export function getTheme(rarity: string): RarityTheme {
  return RARITY_THEMES[(rarity as RarityTier)] ?? RARITY_THEMES.core;
}
