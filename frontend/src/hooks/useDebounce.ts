// ── frontend/src/hooks/useDebounce.ts ────────────────────────
import { useEffect, useState } from 'react';

/**
 * Retrasa la actualización de un valor hasta que deje de cambiar
 * durante `delay` ms. Úsalo para controles de búsqueda.
 *
 * @example
 *   const debouncedSearch = useDebounce(searchInput, 300);
 *   // debouncedSearch solo cambia 300 ms después del último keystroke
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}