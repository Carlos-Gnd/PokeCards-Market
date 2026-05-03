import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTilt3D } from './hooks/useTilt3D';
import { getTheme } from './rarity-themes';
import { getVariantVisualStyle } from './variant-visuals';
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
  owned?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  enableTilt?: boolean;
  lightweight?: boolean;
  /**
   * BUG FIX: Se eliminó el modo 'static' de shineMode porque el div
   * arc-static-card-shine generaba un sweep de color visible que cubría
   * media carta al rotar con el tilt 3D. El único modo válido es 'reactive'
   * (gradiente puntual que sigue al cursor) o 'none' para desactivarlo.
   */
  shineMode?: 'reactive' | 'none';
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
 * Arquitectura por capas (de fondo a frente):
 *   z-0:  AmbientGlow (halo detrás)
 *   z-1:  RaysLayer (rayos de energía)
 *   z-2:  FoilLayer (foil multicolor)
 *   z-3:  HoloLayer (holográfico iridiscente)
 *   z-4:  ShimmerLayer (sweep horizontal sutil)
 *   z-5:  CardArtwork (la imagen — ahora flex-[3])
 *   z-6:  ParticlesLayer (chispas decorativas)
 *   z-7:  Badges + Metadata (UI textual)
 *   z-8:  ShineLayer (gloss puntual del cursor — solo 'reactive')
 *
 * ELIMINADOS:
 *   - arc-luminous-foil: generaba sweep de color azul-cyan por toda la carta
 *   - arc-static-card-shine: sweep blanco animado que cubría medio card
 *   Ambos causaban el efecto visual "de color que cubre la mitad de la carta
 *   y va rotando" que el usuario reportó.
 */
function CardImpl({
  card,
  owned,
  size = 'md',
  onClick,
  enableTilt = true,
  lightweight = false,
  shineMode = 'reactive',
}: CardProps) {
  const theme = getTheme(card.rarity);
  const variantStyle = getVariantVisualStyle(card.variant);
  const dim = SIZE_DIMS[size];
  const tiltEnabled = enableTilt && !lightweight;
  const tilt = useTilt3D({
    maxTilt: theme.tiltMaxDeg,
    intensity: theme.tiltIntensity,
    shineOpacity: theme.tier === 'eternal' || theme.tier === 'ascendant' ? 0.7 : 0.55,
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
    <motion.div
      ref={tiltRef}
      onClick={onClick}
      whileHover={onClick ? { y: -4, scale: 1.03 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.5 }}
      className={`group relative ${dim.w} ${dim.aspect} cursor-pointer select-none`}
      style={{ perspective: 1100, transformStyle: 'preserve-3d' }}
    >
      {!lightweight && <AmbientGlow theme={theme} hoverGlow={tiltMotion.glowOpacity} />}

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

          {/*
            BUG FIX: Se eliminó el div arc-luminous-foil que existía aquí.
            Ese div con su pseudo-elemento ::after generaba un sweep de color
            azul-cyan animado (arc-luminous-sheen) que barrería de lado a lado
            cubriendo visualmente media carta. Era el efecto "de color que
            cubre la mitad de la carta" que reportó el usuario.

            La variante luminous queda representada únicamente por:
            - Su frameBorder blanco-cyan (de variant-visuals.ts)
            - Su innerOverlay sutil (radial-gradient muy transparente)
            - Su glowShadow cian externo
            Estos tres efectos juntos ya comunican la variante sin arruinar
            la legibilidad de la ilustración.
          */}

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

          {/*
            BUG FIX: Se eliminó el modo 'static' que renderizaba arc-static-card-shine.
            Ese div + ::after producía otro sweep blanco que, al combinarse con el
            tilt 3D, aparecía como "un efecto de color que va rotando" cubriendo
            la mitad de la carta.

            Solo se mantiene el modo 'reactive' (ShineLayer) que es un punto de
            brillo puntual y sutil que sigue al cursor sin barrer la carta.
          */}
          {tiltEnabled && shineMode === 'reactive' && (
            <ShineLayer
              shineX={tiltMotion.shineX}
              shineY={tiltMotion.shineY}
              opacity={tiltMotion.shineOpacity}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return isVaulted ? <SlabFrame grade="10">{inner}</SlabFrame> : inner;
}

export const Card = memo(CardImpl);