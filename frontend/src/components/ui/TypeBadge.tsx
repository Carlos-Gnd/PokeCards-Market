import { cn } from '../../lib/utils';
import { getTypeColor } from '../../lib/rarity';

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border backdrop-blur-sm',
        getTypeColor(type),
        className,
      )}
    >
      {type}
    </span>
  );
}
