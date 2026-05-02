import { memo } from 'react';
import type { RarityTheme } from '../rarity-themes';

function FoilLayerImpl({ theme }: { theme: RarityTheme }) {
  const foil = theme.layers.foil;
  if (!foil) return null;

  let bg = '';
  if (foil === 'rainbow') {
    bg =
      'linear-gradient(125deg, rgba(255,0,128,0.5), rgba(0,200,255,0.5), rgba(255,200,0,0.5), rgba(160,0,255,0.5), rgba(255,0,128,0.5))';
  } else if (foil === 'prismatic') {
    bg =
      'conic-gradient(from 90deg at 50% 50%, rgba(255,111,181,0.55), rgba(109,94,248,0.55), rgba(53,200,255,0.55), rgba(246,196,83,0.55), rgba(255,111,181,0.55))';
  } else {
    bg =
      'linear-gradient(135deg, rgba(180,180,200,0.4), rgba(255,255,255,0.1), rgba(180,180,200,0.4))';
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] mix-blend-color-dodge opacity-50"
      style={{
        background: bg,
        backgroundSize: foil === 'prismatic' ? '100% 100%' : '300% 100%',
        animation: foil === 'prismatic' ? 'arc-foil-rotate 9s linear infinite' : 'arc-foil-shift 5s ease-in-out infinite',
      }}
    />
  );
}

export const FoilLayer = memo(FoilLayerImpl);
