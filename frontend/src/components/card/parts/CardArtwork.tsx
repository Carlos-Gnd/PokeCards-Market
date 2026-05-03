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
 * CardArtwork — zona visual del Pokémon.
 *
 * FIX: flex-[2.05] era demasiado pequeño — el artwork ocupaba menos de
 * un tercio de la carta. Subido a flex-[3] para que la imagen sea
 * el elemento dominante del card, como en las cartas TCG reales.
 *
 * FIX: scale(1.1) sobre la imagen hacía que se recortara al desbordarse
 * del contenedor overflow-hidden. Eliminado — la imagen ahora se muestra
 * a escala 1 con object-contain, respetando sus proporciones.
 *
 * FIX: padding reducido de '2%' a '0%' para aprovechar al máximo el espacio.
 */
function CardArtworkImpl({ imageUrl, name, theme, parallaxX, parallaxY, signature }: Props) {
  return (
    <div
      className="relative z-[5] flex-[3] min-h-0 overflow-hidden rounded-md mx-0.5 my-0.5"
      style={{
        background: `linear-gradient(180deg, ${theme.accentColor}10, transparent 70%)`,
      }}
    >
      <div className="absolute inset-0.5 overflow-hidden rounded-md flex items-center justify-center">
        <motion.img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="w-full h-full object-contain select-none"
          style={{
            x: parallaxX,
            y: parallaxY,
            translateZ: 28,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            // FIX: sin scale extra; padding mínimo para que la imagen llene la carta
            padding: signature ? '0%' : '1%',
            filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.55))',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md border border-white/5"
          style={{ boxShadow: `inset 0 0 0 1px ${theme.accentColor}18` }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{ boxShadow: `inset 0 0 0 1px ${theme.accentColor}33` }}
      />
    </div>
  );
}

export const CardArtwork = memo(CardArtworkImpl);