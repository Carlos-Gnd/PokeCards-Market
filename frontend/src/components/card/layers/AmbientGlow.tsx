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
      {/* Halo base, expansivo y suave */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-4 z-[0] rounded-[28px]"
        style={{
          background: theme.glowShadow.replace(/^0 0 \d+px /, ''),
          filter: 'blur(28px)',
          opacity: theme.layers.breathing ? undefined : 0.55,
          animation: theme.layers.breathing ? 'arc-breathe 4.2s ease-in-out infinite' : undefined,
        }}
      />
      {/* Boost extra en hover */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-6 z-[0] rounded-[32px]"
        style={{
          background: theme.glowShadow.replace(/^0 0 \d+px /, ''),
          filter: 'blur(40px)',
          opacity: hoverGlow,
        }}
      />
      {/* Eternal: capa rosa-azul-oro extra */}
      {eternal && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 z-[0] rounded-[36px] opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, #FF6FB5, #6D5EF8, #35C8FF, #F6C453, #FF6FB5)',
            filter: 'blur(50px)',
            animation: 'arc-foil-rotate 14s linear infinite, arc-breathe 5s ease-in-out infinite',
          }}
        />
      )}
      {ascendant && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 z-[0] rounded-[32px] opacity-50"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #35C8FF, #F6C453)',
            filter: 'blur(34px)',
            animation: 'arc-breathe 5s ease-in-out infinite',
          }}
        />
      )}
      {apex && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-5 z-[0] rounded-[28px] opacity-50"
          style={{
            background: 'radial-gradient(circle, #F6C453 0%, transparent 70%)',
            filter: 'blur(28px)',
            animation: 'arc-breathe 4s ease-in-out infinite',
          }}
        />
      )}
    </>
  );
}

export const AmbientGlow = memo(AmbientGlowImpl);
