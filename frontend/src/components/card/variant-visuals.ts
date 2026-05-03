import type { CSSProperties } from 'react';

export interface VariantVisualStyle {
  frameBorder?: string;
  innerOverlay?: string;
  glowShadow?: string;
  badgeStyle?: CSSProperties;
  badgeClassName?: string;
}

const LUMINOUS_STYLE: VariantVisualStyle = {
  frameBorder:
    'linear-gradient(135deg, rgba(238,253,255,0.95) 0%, rgba(126,226,247,0.88) 28%, rgba(255,255,255,0.76) 50%, rgba(108,203,229,0.82) 74%, rgba(229,250,255,0.92) 100%)',
  innerOverlay:
    'radial-gradient(circle at 50% 5%, rgba(236,253,255,0.18) 0%, rgba(125,226,247,0.10) 34%, transparent 66%), linear-gradient(180deg, rgba(236,253,255,0.08), transparent 48%)',
  glowShadow:
    '0 18px 42px -22px rgba(125,226,247,0.7), 0 0 26px rgba(236,253,255,0.22)',
  badgeClassName: 'shadow-[0_0_18px_rgba(125,226,247,0.16)]',
  badgeStyle: {
    borderColor: 'rgba(188,245,255,0.48)',
    background:
      'linear-gradient(135deg, rgba(238,253,255,0.18), rgba(125,226,247,0.10) 58%, rgba(255,255,255,0.08))',
    color: '#DDFBFF',
  },
};

export function getVariantVisualStyle(variant?: string): VariantVisualStyle | null {
  if (variant === 'luminous') return LUMINOUS_STYLE;
  return null;
}
