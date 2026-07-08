import { useState, useCallback } from 'react';
import { OrderService } from '../services/OrderService';
import type { CustomerData } from '../types';

/**
 * Búsqueda de cliente existente por cédula/RUC, reutilizada en todo
 * formulario que pida ese dato: registro de ingreso, edición de orden,
 * venta directa, facturación al entregar. Un solo lugar para el
 * comportamiento — no una copia distinta por pantalla.
 */
export function useClienteLookup() {
  const [isSearching, setIsSearching] = useState(false);
  const [found, setFound] = useState<CustomerData | null>(null);

  const lookup = useCallback(async (cedula: string): Promise<CustomerData | null> => {
    const trimmed = cedula.trim();
    if (trimmed.length < 4) {
      setFound(null);
      return null;
    }
    setIsSearching(true);
    try {
      const res = await OrderService.checkClientByCedula(trimmed);
      const client = res.found && res.client ? res.client : null;
      setFound(client);
      return client;
    } catch (err) {
      console.error('Error buscando cliente:', err);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { lookup, isSearching, found };
}
