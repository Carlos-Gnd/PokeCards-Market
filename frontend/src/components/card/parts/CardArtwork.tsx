import { memo } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import type { RarityTheme } from '../rarity-themes';

interface Props {
  imageUrl: string;
  name: string;
  pokemonId: number;
  theme: RarityTheme;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  signature?: boolean;
}

/**
 * CardArtwork — la zona visual del Pokémon. La imagen tiene parallax 3D
 * (se mueve sutilmente hacia la dirección del cursor) y queda "flotando"
 * por encima del fondo gracias a translateZ.
 */
function CardArtworkImpl({ imageUrl, name, theme, parallaxX, parallaxY, signature }: Props) {
  return (
    <div
      className="relative z-[5] flex-1 overflow-hidden rounded-md mx-1"
      style={{
        background: `linear-gradient(180deg, ${theme.accentColor}10, transparent 70%)`,
      }}
    >
      <motion.img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none"
        style={{
          x: parallaxX,
          y: parallaxY,
          translateZ: 28,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          padding: signature ? '4%' : '12%',
          filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.55))',
        }}
      />
      {/* Inner ring del marco interior */}
      <div
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          boxShadow: `inset 0 0 0 1px ${theme.accentColor}33`,
        }}
      />
    </div>
  );
}

export const CardArtwork = memo(CardArtworkImpl);
