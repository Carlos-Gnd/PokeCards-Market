import { memo, useMemo } from 'react';
import type { RarityTheme } from '../rarity-themes';

interface Props {
  theme: RarityTheme;
  seed: number;
}

/**
 * ParticlesLayer — chispas decorativas. Posiciones determinísticas por seed
 * para que cada carta tenga un patrón único pero estable entre renders.
 */
function ParticlesLayerImpl({ theme, seed }: Props) {
  const variant = theme.layers.particles;
  if (!variant) return null;

  const count = variant === 'ring' ? 18 : variant === 'dense' ? 14 : variant === 'medium' ? 10 : 6;
  const accent = theme.accentColor;

  const particles = useMemo(() => {
    const items: Array<{ x: number; y: number; size: number; delay: number; duration: number }> = [];
    let s = seed * 9301 + 49297;
    const next = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    if (variant === 'ring') {
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const r = 38 + next() * 6;
        items.push({
          x: 50 + Math.cos(ang) * r,
          y: 50 + Math.sin(ang) * r,
          size: 2 + next() * 2,
          delay: next() * 3,
          duration: 2.4 + next() * 1.6,
        });
      }
    } else {
      for (let i = 0; i < count; i++) {
        items.push({
          x: 5 + next() * 90,
          y: 5 + next() * 90,
          size: 1.5 + next() * 2.5,
          delay: next() * 4,
          duration: 1.8 + next() * 2.5,
        });
      }
    }
    return items;
  }, [count, seed, variant]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: accent,
            boxShadow: `0 0 6px ${accent}, 0 0 12px ${accent}`,
            animation: `arc-sparkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

export const ParticlesLayer = memo(ParticlesLayerImpl);
