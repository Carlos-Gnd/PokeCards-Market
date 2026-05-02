import { memo } from 'react';
import type { RarityTheme } from '../rarity-themes';

function RaysLayerImpl({ theme }: { theme: RarityTheme }) {
  if (!theme.layers.rays) return null;

  // Rayos detrás del artwork, color según tier
  const color = theme.accentColor;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-1/2 w-[160%] h-[160%] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 50%, ${color}33 0deg, transparent 6deg, transparent 18deg, ${color}33 24deg)`,
          animation: 'arc-rays-rotate 24s linear infinite',
          maskImage: 'radial-gradient(circle at 50% 40%, white 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, white 30%, transparent 70%)',
        }}
      />
    </div>
  );
}

export const RaysLayer = memo(RaysLayerImpl);
