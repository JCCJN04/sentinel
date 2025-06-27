// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook personalizado que retrasa la actualización de un valor.
 * Esencial para no hacer una llamada a la API con cada letra que se teclea.
 * @param value El valor a "debouncear" (ej: el texto de búsqueda).
 * @param delay El tiempo de espera en milisegundos.
 * @returns El valor después del tiempo de espera.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura un temporizador para actualizar el valor "debounced"
    // después del tiempo de espera especificado.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza: se ejecuta si el valor cambia antes de que
    // se cumpla el tiempo de espera. Cancela el temporizador anterior.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si el valor o el delay cambian

  return debouncedValue;
}
