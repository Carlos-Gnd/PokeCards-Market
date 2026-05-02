import { cn } from '../../lib/utils';

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      className={cn('animate-spin text-primary', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FullscreenLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size={48} />
      {label && <p className="text-white/60 text-sm">{label}</p>}
    </div>
  );
}
