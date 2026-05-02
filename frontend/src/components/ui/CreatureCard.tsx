import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { cn, formatPrice } from '../../lib/utils';
import { getRarityConfig, VARIANT_LABEL } from '../../lib/rarity';
import { RarityBadge } from './RarityBadge';
import { TypeBadge } from './TypeBadge';
import type { ArcadiumCard } from '../../types';

interface Props {
  card: ArcadiumCard;
  owned?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function CreatureCard({ card, owned, onClick, size = 'md' }: Props) {
  const cfg = getRarityConfig(card.rarity);
  const isHigh = cfg.intensity >= 5;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={cn(
        'group relative text-left rounded-2xl overflow-hidden border-2',
        'bg-gradient-to-b from-surface-2 to-surface',
        cfg.borderClass,
        cfg.shadow,
        size === 'sm' && 'w-full',
        size === 'lg' && 'w-full max-w-sm',
        owned && 'ring-2 ring-success/60',
      )}
    >
      {/* Glow ambient */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500',
          'bg-gradient-to-b',
          cfg.bgGlow,
          'group-hover:opacity-100',
        )}
      />

      {/* Eternal: rays */}
      {cfg.tier === 'eternal' && (
        <div className="pointer-events-none absolute inset-0 opacity-50 group-hover:opacity-90 transition-opacity">
          <div className="absolute -inset-1 bg-aurora opacity-30 blur-2xl animate-glow-pulse" />
        </div>
      )}

      {/* Header con rareza */}
      <div className="relative z-10 flex items-start justify-between p-3 pb-1">
        <RarityBadge rarity={card.rarity} size={size === 'sm' ? 'xs' : 'sm'} />
        {owned ? (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider px-2 py-1 rounded-md bg-success/20 text-success border border-success/40">
            <Check size={11} /> Adquirida
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-medium tracking-wider px-2 py-1 rounded-md bg-white/[0.04] text-white/50 border border-white/10">
            <Lock size={10} /> Bloqueada
          </span>
        )}
      </div>

      {/* Imagen */}
      <div
        className={cn(
          'relative z-10 mx-3 my-1 aspect-square rounded-xl overflow-hidden',
          'bg-gradient-radial from-white/[0.05] to-transparent',
          isHigh && 'ring-2',
          cfg.ringClass,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
            className={cn(
              'w-[88%] h-[88%] object-contain transition-transform duration-500',
              'group-hover:scale-110 group-hover:rotate-1 drop-shadow-2xl',
              isHigh && 'animate-float',
            )}
            style={{ filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.45))' }}
          />
        </div>
        {/* Shine sweep on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer shimmer-overlay" />
        {/* Pokémon ID */}
        <div className="absolute top-1.5 left-2 text-[10px] font-mono text-white/30">
          #{String(card.pokemonId).padStart(3, '0')}
        </div>
      </div>

      {/* Info */}
      <div className="relative z-10 p-3 pt-2 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display font-bold text-base leading-tight truncate">{card.name}</h3>
          <span className={cn('text-[10px] uppercase font-semibold tracking-wider', cfg.textClass)}>
            {VARIANT_LABEL[card.variant] ?? card.variant}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          <TypeBadge type={card.type} />
          {card.secondaryType && <TypeBadge type={card.secondaryType} />}
        </div>

        <div className="flex items-end justify-between pt-1">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Mercado</div>
          <div className={cn('font-display font-bold text-lg', cfg.textClass)}>
            {formatPrice(card.marketPrice)}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
