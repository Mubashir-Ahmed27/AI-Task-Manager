import { useEffect, useState } from 'react';

/**
 * Tracks the user's `prefers-reduced-motion` setting so animations can be skipped.
 * Listens for live changes (some users toggle it per-app).
 */
export function useReducedMotion() {
  const [isReduced, setIsReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event) => setIsReduced(event.matches);

    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return isReduced;
}
