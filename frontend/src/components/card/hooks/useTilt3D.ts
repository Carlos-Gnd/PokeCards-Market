import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';

interface TiltOptions {
  /** Máximo grados de rotación. */
  maxTilt?: number;
  /** Si se desactiva en mobile. */
  disableOnTouch?: boolean;
  /** Multiplicador de la pendiente para sentirse más cinematográfico. */
  intensity?: number;
  /** Evita registrar listeners cuando la carta se renderiza en modo ligero. */
  disabled?: boolean;
}

export interface TiltMotionValues {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  glowOpacity: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}

/**
 * Hook GPU-friendly de tilt 3D + shine reactivo al cursor.
 * Usa motion values (no React state) para evitar re-renders.
 * Devuelve { ref, motionValues } — anclar ref al contenedor con perspective.
 */
export function useTilt3D(options: TiltOptions = {}) {
  const {
    maxTilt = 12,
    disableOnTouch = true,
    intensity = 1,
    disabled = false,
  } = options;

  const ref = useRef<HTMLDivElement | null>(null);

  // Coordenadas crudas (-0.5 .. 0.5)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring smoothing para sentirse natural
  const x = useSpring(rawX, { stiffness: 250, damping: 22, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 250, damping: 22, mass: 0.4 });

  const rotateX = useTransform(y, [-0.5, 0.5], [maxTilt * intensity, -maxTilt * intensity]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxTilt * intensity, maxTilt * intensity]);

  const glowO = useMotionValue(0);

  const parallaxX = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const parallaxY = useTransform(y, [-0.5, 0.5], [-8, 8]);

  // glowO eliminado de las deps: no se usa dentro del callback (estaba comentado)
  const handleMove = useCallback((e: PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(px);
    rawY.set(py);
  }, [rawX, rawY]);

  const handleLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    glowO.set(0);
  }, [rawX, rawY, glowO]);

  useEffect(() => {
    if (disabled) return;

    const el = ref.current;
    if (!el) return;

    const isTouch = disableOnTouch && matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, [disabled, disableOnTouch, handleMove, handleLeave]);

  return {
    ref,
    motion: { rotateX, rotateY, glowOpacity: glowO, parallaxX, parallaxY },
  };
}