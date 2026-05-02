import { useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';

interface TiltOptions {
  /** Máximo grados de rotación. */
  maxTilt?: number;
  /** Intensidad del shine que sigue al cursor. */
  shineOpacity?: number;
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
  shineX: MotionValue<string>;
  shineY: MotionValue<string>;
  shineOpacity: MotionValue<number>;
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
    shineOpacity = 0.55,
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

  const shineXp = useTransform(x, [-0.5, 0.5], ['10%', '90%']);
  const shineYp = useTransform(y, [-0.5, 0.5], ['10%', '90%']);

  const shineO = useMotionValue(0);
  const glowO = useMotionValue(0);

  const parallaxX = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const parallaxY = useTransform(y, [-0.5, 0.5], [-8, 8]);

  const handleMove = useCallback((e: PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(px);
    rawY.set(py);
    shineO.set(shineOpacity);
    glowO.set(1);
  }, [rawX, rawY, shineO, glowO, shineOpacity]);

  const handleLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    shineO.set(0);
    glowO.set(0);
  }, [rawX, rawY, shineO, glowO]);

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
  }, [handleMove, handleLeave, disableOnTouch, disabled]);

  return {
    ref,
    motion: {
      rotateX,
      rotateY,
      shineX: shineXp,
      shineY: shineYp,
      shineOpacity: shineO,
      glowOpacity: glowO,
      parallaxX,
      parallaxY,
    } as TiltMotionValues,
  };
}
