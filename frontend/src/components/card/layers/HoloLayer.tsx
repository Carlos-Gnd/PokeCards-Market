import { memo } from 'react';
import type { RarityTheme } from '../rarity-themes';

interface Props {
  theme: RarityTheme;
}

/**
 * HoloLayer — textura holográfica iridiscente. Se intensifica con el hover
 * mediante variables CSS controladas por el padre. Sin re-renders por mouse.
 */
function HoloLayerImpl({ theme }: Props) {
  const intensity = theme.layers.holo;
  if (!intensity) return null;

  const opacity = intensity === 'subtle' ? 0.18 : intensity === 'partial' ? 0.32 : intensity === 'full' ? 0.5 : 0.65;
  const isRainbow = intensity === 'rainbow' || intensity === 'full';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[3] mix-blend-soft-light"
      style={{ opacity }}
    >
      {isRainbow ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(255,0,128,0.55) 35%, rgba(0,200,255,0.55) 45%, rgba(255,200,0,0.55) 55%, rgba(160,0,255,0.55) 65%, transparent 70%)',
            backgroundSize: '300% 100%',
            animation: 'arc-holo-shift 6s linear infinite',
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)',
            backgroundSize: '250% 100%',
            animation: 'arc-holo-sweep 7s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

export const HoloLayer = memo(HoloLayerImpl);
