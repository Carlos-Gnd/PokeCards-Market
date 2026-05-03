import { memo } from 'react';
import { motion, useMotionTemplate, type MotionValue } from 'framer-motion';

interface Props {
  shineX: MotionValue<string>;
  shineY: MotionValue<string>;
  opacity: MotionValue<number>;
}

/**
 * ShineLayer — brillo sutil que sigue al cursor.
 *
 * FIX: El gradiente original era demasiado ancho (circle 34% de radio colocado
 * en la posición exacta del cursor) lo que causaba que una mancha blanco-dorada
 * cubriera visualmente media carta y fuera muy llamativa.
 *
 * Nuevo comportamiento: gradiente mucho más pequeño y sutil, con radio ~14%,
 * mezclado en `overlay` en lugar de `soft-light` para que el efecto sea un
 * destello puntual tipo "gloss" en vez de una mancha de color grande.
 */
function ShineLayerImpl({ shineX, shineY, opacity }: Props) {
  const bg = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 10%, transparent 22%)`;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[8] mix-blend-overlay rounded-[inherit]"
      style={{ background: bg, opacity }}
    />
  );
}

export const ShineLayer = memo(ShineLayerImpl);