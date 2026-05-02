import { memo } from 'react';
import { motion, useMotionTemplate, type MotionValue } from 'framer-motion';

interface Props {
  shineX: MotionValue<string>;
  shineY: MotionValue<string>;
  opacity: MotionValue<number>;
}

/**
 * ShineLayer — gradiente radial siguiendo el cursor. Se anima con motion values
 * (no React state) para evitar re-renders. La opacidad se eleva en hover.
 */
function ShineLayerImpl({ shineX, shineY, opacity }: Props) {
  const bg = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.16) 18%, transparent 45%)`;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[8] mix-blend-overlay rounded-[inherit]"
      style={{ background: bg, opacity }}
    />
  );
}

export const ShineLayer = memo(ShineLayerImpl);
