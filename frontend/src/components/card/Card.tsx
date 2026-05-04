import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTilt3D } from './hooks/useTilt3D';
import { getTheme } from './rarity-themes';
import { getVariantVisualStyle } from './variant-visuals';
import { RaysLayer } from './layers/RaysLayer';
import { FoilLayer } from './layers/FoilLayer';
import { HoloLayer } from './layers/HoloLayer';
import { ShimmerLayer } from './layers/ShimmerLayer';
import { ParticlesLayer } from './layers/ParticlesLayer';
import { CardBadges } from './parts/CardBadges';
import { CardArtwork } from './parts/CardArtwork';
import { CardMetadata } from './parts/CardMetadata';
import { SlabFrame } from './parts/SlabFrame';
import type { ArcadiumCard } from '../../types';

export interface CardProps {
  card: ArcadiumCard;
  owned?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  enableTilt?: boolean;
  lightweight?: boolean;
}

const SIZE_DIMS: Record<NonNullable<CardProps['size']>, { w: string; aspect: string }> = {
  sm: { w: 'w-full', aspect: 'aspect-[5/7]' },
  md: { w: 'w-full', aspect: 'aspect-[5/7]' },
  lg: { w: 'w-full', aspect: 'aspect-[5/7]' },
  xl: { w: 'w-full', aspect: 'aspect-[5/7]' },
};

/**
 * `Card` — composer principal del sistema de cartas ARCADIUM.
 *
 * BUG FIX (blur/desenfoque al hover):
 *   El `whileHover={{ y: -4, scale: 1.03 }}` en el motion.div interno con
 *   `overflow: hidden` forzaba al navegador a re-componer la carta en GPU en
 *   cada frame del hover, produciendo un frame de anti-aliasing visible como
 *   blur. También la clase `group` activaba el `drop-shadow` del contenedor
 *   superior que combinado con el scale creaba el efecto desenfocado.
 *
 *   Solución: Se elimina el whileHover del motion.div interno y se mueve
 *   la elevación a CSS puro con `transition` y `translateY` en el wrapper.
 *   CSS transforms en el contenedor externo (sin overflow:hidden) no causan
 *   re-composición del contenido interno.
 */
function CardImpl({
  card,
  owned,
  size = 'md',
  onClick,
  enableTilt = true,
  lightweight = false,
}: CardProps) {
  const theme = getTheme(card.rarity);
  const variantStyle = getVariantVisualStyle(card.variant);
  const dim = SIZE_DIMS[size];
  const tiltEnabled = enableTilt && !lightweight;
  const tilt = useTilt3D({
    maxTilt: theme.tiltMaxDeg,
    intensity: theme.tiltIntensity,
    disableOnTouch: true,
    disabled: !tiltEnabled,
  });
  const { ref: tiltRef, motion: tiltMotion } = tilt;

  const isVaulted = card.variant === 'vaulted' && !lightweight;
  const isSignature = card.variant === 'signature';
  const isPrestige = card.variant === 'prestige';

  const frameBorder = variantStyle?.frameBorder ?? theme.frameBorder;
  const frameBackground = variantStyle?.innerOverlay
    ? `${variantStyle.innerOverlay}, ${theme.frameBg}`
    : theme.frameBg;
  const frameShadow = lightweight
    ? theme.cardShadow
    : [theme.cardShadow, theme.glowShadow, variantStyle?.glowShadow].filter(Boolean).join(', ');

  const inner = (
    /*
      FIX BUG (blur): Se usa un div wrapper con CSS hover en lugar de
      whileHover de Framer Motion en el div con overflow:hidden.
      La transición CSS en el contenedor EXTERNO (este div) no fuerza
      re-composición del contenido, eliminando el blur.
    */
    <div
      className={`group relative ${dim.w} ${dim.aspect} ${onClick ? 'card-hover-lift' : ''}`}
      style={{ perspective: 1100 }}
      onClick={onClick}
    >
      <motion.div
        ref={tiltRef}
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            rotateX: tiltEnabled ? tiltMotion.rotateX : 0,
            rotateY: tiltEnabled ? tiltMotion.rotateY : 0,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            background: frameBorder,
            padding: '2px',
            boxShadow: frameShadow,
          }}
        >
          <div
            className="relative w-full h-full rounded-[14px] overflow-hidden flex flex-col p-2"
            style={{ background: frameBackground }}
          >
            {owned && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[14px] z-[9]"
                style={{ boxShadow: 'inset 0 0 0 2px rgba(34,197,94,0.65)' }}
              />
            )}

            {!lightweight && (
              <>
                <RaysLayer theme={theme} />
                <FoilLayer theme={theme} />
                <HoloLayer theme={theme} />
                <ShimmerLayer theme={theme} />
              </>
            )}

            <CardBadges theme={theme} variant={card.variant} ownedBadge={owned} />

            <CardArtwork
              imageUrl={card.imageUrl}
              name={card.name}
              pokemonId={card.pokemonId}
              theme={theme}
              parallaxX={tiltMotion.parallaxX}
              parallaxY={tiltMotion.parallaxY}
              signature={isSignature || isPrestige}
            />

            {!lightweight && <ParticlesLayer theme={theme} seed={card.pokemonId} />}

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
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  return isVaulted ? <SlabFrame grade="10">{inner}</SlabFrame> : inner;
}

export const Card = memo(CardImpl);
