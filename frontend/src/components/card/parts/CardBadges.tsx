import { memo } from 'react';
import { Crown, Flame, Gem, Shield, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { RarityTheme } from '../rarity-themes';
import type { RarityTier } from '../../../lib/rarity';

const ICON_BY_TIER: Record<RarityTier, any> = {
  core: Shield,
  alloy: Star,
  prime: Zap,
  elite: Sparkles,
  apex: Flame,
  ascendant: Crown,
  eternal: Gem,
};

interface Props {
  theme: RarityTheme;
  variant: string;
  ownedBadge?: boolean;
}

function CardBadgesImpl({ theme, variant, ownedBadge }: Props) {
  const Icon = ICON_BY_TIER[theme.tier];

  return (
    <div className="relative z-[7] flex items-start justify-between gap-1.5">
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border backdrop-blur-md',
          'text-[10px] uppercase tracking-[0.16em] font-display font-bold leading-none',
        )}
        style={{
          borderColor: theme.accentColor + '66',
          backgroundColor: theme.accentColor + '20',
          color: theme.accentColor,
        }}
      >
        <Icon size={10} />
        {theme.label}
      </div>

      {ownedBadge && (
        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-success/25 text-success border border-success/45 backdrop-blur-md">
          OWNED
        </span>
      )}

      <span
        className={cn(
          'inline-flex items-center text-[8px] uppercase tracking-[0.18em] font-bold px-1.5 py-0.5 rounded-md',
          'bg-black/40 backdrop-blur-md border border-white/10',
        )}
        style={{ color: theme.metaColor }}
      >
        {variant}
      </span>
    </div>
  );
}

export const CardBadges = memo(CardBadgesImpl);
