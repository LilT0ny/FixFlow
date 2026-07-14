import { useState, useEffect, useRef } from 'react';
import { RepuestoService, type Repuesto } from '../services/RepuestoService';

const DEBOUNCE_MS = 300;

/**
 * Búsqueda de repuestos mientras se escribe (debounced). A diferencia de
 * useClienteLookup (on-blur, match exacto por cédula), acá no hay texto
 * exacto que buscar — es un patrón nuevo en el codebase, no una copia de
 * uno existente.
 */
export function useRepuestoLookup(query: string) {
  const [results, setResults] = useState<Repuesto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const currentRequest = ++requestId.current;

    const timer = setTimeout(async () => {
      try {
        const found = await RepuestoService.search(trimmed);
        // Descarta resultados de búsquedas viejas si el usuario ya siguió tipeando.
        if (currentRequest === requestId.current) setResults(found);
      } catch (err) {
        console.error('Error buscando repuestos:', err);
      } finally {
        if (currentRequest === requestId.current) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, isSearching };
}
