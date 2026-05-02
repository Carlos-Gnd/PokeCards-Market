import { memo } from 'react';
import { cn, formatPrice } from '../../../lib/utils';
import { TypeBadge } from '../../ui/TypeBadge';
import type { RarityTheme } from '../rarity-themes';

interface Props {
  name: string;
  pokemonId: number;
  type: string;
  secondaryType?: string | null;
  hp: number;
  price: number;
  theme: RarityTheme;
  compact?: boolean;
}

function CardMetadataImpl({ name, pokemonId, type, secondaryType, hp, price, theme, compact }: Props) {
  return (
    <div className="relative z-[7] flex flex-col gap-1.5 mt-1">
      <div className="flex items-baseline justify-between gap-2">
        <h3
          className={cn(
            'font-display font-black truncate leading-tight',
            compact ? 'text-sm' : 'text-base',
          )}
          style={{ color: theme.nameColor }}
        >
          {name}
        </h3>
        <span
          className="font-mono font-bold leading-none whitespace-nowrap text-xs"
          style={{ color: theme.accentColor }}
        >
          {hp} HP
        </span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <TypeBadge type={type} className="text-[9px] px-1.5 py-px" />
        {secondaryType && <TypeBadge type={secondaryType} className="text-[9px] px-1.5 py-px" />}
        <span className="ml-auto text-[9px] font-mono text-white/30">
          #{String(pokemonId).padStart(3, '0')}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">Mercado</span>
        <span
          className="font-display font-black"
          style={{ color: theme.accentColor }}
        >
          {formatPrice(price)}
        </span>
      </div>
    </div>
  );
}

export const CardMetadata = memo(CardMetadataImpl);
