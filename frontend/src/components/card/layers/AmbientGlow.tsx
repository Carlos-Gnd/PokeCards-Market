import { memo } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import type { RarityTheme } from '../rarity-themes';

interface Props {
  theme: RarityTheme;
  hoverGlow: MotionValue<number>;
}

/**
 * AmbientGlow — halo detrás de la carta. Tiene base estática + boost en hover.
 * Para tier ETERNAL, multi-capa con respiración.
 */
function AmbientGlowImpl({ theme, hoverGlow }: Props) {
  if (!theme.layers.ambientGlow) return null;

  const eternal = theme.tier === 'eternal';
  const ascendant = theme.tier === 'ascendant';
  const apex = theme.tier === 'apex';

  return (
    <>
      
      
    </>
  );
}

export const AmbientGlow = memo(AmbientGlowImpl);
