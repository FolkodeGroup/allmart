import { useState, useEffect } from 'react';

/**
 * Hook para debouncing de valores (útil para inputs controlados)
 * @param value Valor a debounciar
 * @param delay Milisegundos de espera
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
