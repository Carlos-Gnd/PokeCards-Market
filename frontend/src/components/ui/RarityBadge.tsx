import { cn } from '../../lib/utils';
import { getRarityConfig } from '../../lib/rarity';
import { Sparkles, Crown, Flame, Gem, Star, Zap, Shield } from 'lucide-react';

const ICON_BY_TIER = {
  core: Shield,
  alloy: Star,
  prime: Zap,
  elite: Sparkles,
  apex: Flame,
  ascendant: Crown,
  eternal: Gem,
} as const;

export function RarityBadge({
  rarity,
  size = 'sm',
  className,
}: {
  rarity: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const cfg = getRarityConfig(rarity);
  const Icon = ICON_BY_TIER[cfg.tier] ?? Shield;
  const sizing = size === 'xs' ? 'text-[10px] px-1.5 py-0.5 gap-1' : size === 'md' ? 'text-sm px-3 py-1.5 gap-1.5' : 'text-xs px-2 py-1 gap-1';
  const iconSize = size === 'xs' ? 10 : size === 'md' ? 14 : 12;
  return (
    <span
      className={cn(
        'inline-flex items-center font-display font-semibold uppercase tracking-wider rounded-full border backdrop-blur-md',
        cfg.badgeClass,
        sizing,
        className,
      )}
    >
      <Icon size={iconSize} className="opacity-90" />
      {cfg.label}
    </span>
  );
}
