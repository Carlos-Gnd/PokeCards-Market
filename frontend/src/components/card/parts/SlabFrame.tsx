import { memo } from 'react';

/**
 * SlabFrame — efecto encapsulado tipo PSA slab para variant `vaulted`.
 * Envuelve a la carta en una "lámina acrílica" con etiqueta de grading.
 */
function SlabFrameImpl({ grade, children }: { grade?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 text-[9px] uppercase tracking-[0.2em] font-display font-black rounded-sm"
        style={{
          background: 'linear-gradient(180deg, #fafafa, #d4d4d4)',
          color: '#0B1020',
          boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
          letterSpacing: '0.18em',
        }}
      >
        ARCADIUM · GEM MINT {grade ?? '10'}
      </div>
      <div
        className="rounded-2xl p-1.5"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.12), 0 12px 28px -10px rgba(0,0,0,0.7)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const SlabFrame = memo(SlabFrameImpl);
