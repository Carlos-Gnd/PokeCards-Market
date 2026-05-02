import { memo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useTilt3D } from './hooks/useTilt3D';
import { getTheme } from './rarity-themes';
import { AmbientGlow } from './layers/AmbientGlow';
import { RaysLayer } from './layers/RaysLayer';
import { FoilLayer } from './layers/FoilLayer';
import { HoloLayer } from './layers/HoloLayer';
import { ShimmerLayer } from './layers/ShimmerLayer';
import { ParticlesLayer } from './layers/ParticlesLayer';
import { ShineLayer } from './layers/ShineLayer';
import { CardBadges } from './parts/CardBadges';
import { CardArtwork } from './parts/CardArtwork';
import { CardMetadata } from './parts/CardMetadata';
import { SlabFrame } from './parts/SlabFrame';
import type { ArcadiumCard } from '../../types';

export interface CardProps {
  card: ArcadiumCard;
  /** Si la carta ya pertenece al usuario. */
  owned?: boolean;
  /** Tamaño visual (afecta dimensiones absolutas, no escala el contenido). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Click handler para abrir detalle. */
  onClick?: () => void;
  /** Pasar `false` para desactivar el tilt 3D (e.g. dentro de modales). */
  enableTilt?: boolean;
  /** Render más barato para listados con muchas cartas. */
  lightweight?: boolean;
}

const SIZE_DIMS: Record<NonNullable<CardProps['size']>, { w: string; aspect: string }> = {
  sm: { w: 'w-full max-w-[170px]', aspect: 'aspect-[5/7]' },
  md: { w: 'w-full max-w-[220px]', aspect: 'aspect-[5/7]' },
  lg: { w: 'w-full max-w-[300px]', aspect: 'aspect-[5/7]' },
  xl: { w: 'w-full max-w-[440px]', aspect: 'aspect-[5/7]' },
};

/**
 * `Card` — composer principal del sistema de cartas ARCADIUM.
 *
 * Arquitectura por capas (de fondo a frente):
 *   z-0:  AmbientGlow (halo detrás)
 *   z-1:  RaysLayer (rayos de energía)
 *   z-2:  FoilLayer (foil multicolor)
 *   z-3:  HoloLayer (holográfico iridiscente)
 *   z-4:  ShimmerLayer (sweep horizontal)
 *   z-5:  CardArtwork (la imagen)
 *   z-6:  ParticlesLayer (chispas decorativas)
 *   z-7:  Badges + Metadata (UI textual)
 *   z-8:  ShineLayer (gloss del cursor)
 *
 * Tilt 3D y shine se manejan con motion values (no React state)
 * para evitar re-renders durante el movimiento del cursor.
 */
function CardImpl({ card, owned, size = 'md', onClick, enableTilt = true, lightweight = false }: CardProps) {
  const theme = getTheme(card.rarity);
  const dim = SIZE_DIMS[size];
  const tiltEnabled = enableTilt && !lightweight;
  const tilt = useTilt3D({
    maxTilt: theme.tiltMaxDeg,
    intensity: theme.tiltIntensity,
    shineOpacity: theme.tier === 'eternal' || theme.tier === 'ascendant' ? 0.7 : 0.55,
    disableOnTouch: true,
    disabled: !tiltEnabled,
  });

  const isVaulted = card.variant === 'vaulted' && !lightweight;
  const isSignature = card.variant === 'signature';
  const isPrestige = card.variant === 'prestige';

  // Variant overrides — Luminous = boost ambient brightness; Spectrum = forces foil rainbow
  const variantOverlay: CSSProperties = {};
  if (card.variant === 'luminous') {
    variantOverlay.background = `radial-gradient(circle at 50% 0%, ${theme.accentColor}30 0%, transparent 60%)`;
  }

  const inner = (
    <motion.div
      ref={tilt.ref}
      onClick={onClick}
      whileHover={tiltEnabled ? { translateY: -theme.hoverLift } : undefined}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={`group relative ${dim.w} ${dim.aspect} cursor-pointer select-none`}
      style={{ perspective: 1100, transformStyle: 'preserve-3d' }}
    >
      {/* AmbientGlow vive fuera del frame para no clipear */}
      {!lightweight && <AmbientGlow theme={theme} hoverGlow={tilt.motion.glowOpacity} />}

      {/* Frame + capas internas */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          rotateX: tiltEnabled ? tilt.motion.rotateX : 0,
          rotateY: tiltEnabled ? tilt.motion.rotateY : 0,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          background: theme.frameBorder,
          padding: '2px',
          boxShadow: lightweight ? theme.cardShadow : `${theme.cardShadow}, ${theme.glowShadow}`,
        }}
      >
        {/* Cuerpo interno (separado del borde gradient) */}
        <div
          className="relative w-full h-full rounded-[14px] overflow-hidden flex flex-col p-2.5"
          style={{
            background: theme.frameBg,
            ...variantOverlay,
          }}
        >
          {/* Owned ring */}
          {owned && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[14px] z-[9]"
              style={{ boxShadow: 'inset 0 0 0 2px rgba(34,197,94,0.65)' }}
            />
          )}

          {/* Capas decorativas */}
          {!lightweight && (
            <>
              <RaysLayer theme={theme} />
              <FoilLayer theme={theme} />
              <HoloLayer theme={theme} />
              <ShimmerLayer theme={theme} />
            </>
          )}

          {/* UI superior: badges */}
          <CardBadges theme={theme} variant={card.variant} ownedBadge={owned} />

          {/* Artwork central con parallax */}
          <CardArtwork
            imageUrl={card.imageUrl}
            name={card.name}
            pokemonId={card.pokemonId}
            theme={theme}
            parallaxX={tilt.motion.parallaxX}
            parallaxY={tilt.motion.parallaxY}
            signature={isSignature || isPrestige}
          />

          {/* Particles flotando sobre el artwork */}
          {!lightweight && <ParticlesLayer theme={theme} seed={card.pokemonId} />}

          {/* UI inferior: nombre, tipo, precio */}
          <CardMetadata
            name={card.name}
            pokemonId={card.pokemonId}
            type={card.type}
            secondaryType={card.secondaryType}
            hp={card.stats?.hp ?? 0}
            price={card.marketPrice}
            theme={theme}
            compact={size === 'sm'}
          />

          {/* Shine reactivo al cursor (capa más alta) */}
          {tiltEnabled && (
            <ShineLayer
              shineX={tilt.motion.shineX}
              shineY={tilt.motion.shineY}
              opacity={tilt.motion.shineOpacity}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return isVaulted ? <SlabFrame grade="10">{inner}</SlabFrame> : inner;
}

export const Card = memo(CardImpl);
