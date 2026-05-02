import { memo } from 'react';
import type { RarityTheme } from '../rarity-themes';

function ShimmerLayerImpl({ theme }: { theme: RarityTheme }) {
  const shimmer = theme.layers.shimmer;
  if (!shimmer) return null;
  const duration = shimmer === 'constant' ? '3.5s' : '8s';

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[4] overflow-hidden rounded-[inherit]"
    >
      <div
        className="absolute inset-y-0 -inset-x-1/3"
        style={{
          background:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 48%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.18) 52%, transparent 65%)',
          animation: `arc-shimmer-sweep ${duration} linear infinite`,
        }}
      />
    </div>
  );
}

export const ShimmerLayer = memo(ShimmerLayerImpl);
