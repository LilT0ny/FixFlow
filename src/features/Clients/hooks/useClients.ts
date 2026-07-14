import { useState, useCallback, useEffect } from 'react';
import { ClientService } from '../../../services/ClientService';
import type { Client } from '../../../services/ClientService';
import { PAGE_SIZE } from '../../../constants/pagination';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { clients: data, total: count } = await ClientService.getPaginated(page, PAGE_SIZE, searchTerm);
      setClients(data);
      setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  // Búsqueda debounced: cambiar de página es inmediato, tipear una
  // búsqueda espera una pausa antes de pegarle al server.
  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  /** Cambiar el término de búsqueda siempre vuelve a la página 1. */
  const setSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const saveClient = useCallback(async (client: Client | Omit<Client, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      await ClientService.saveClient(client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving client');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await ClientService.deleteClient(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting client');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    clients,
    total,
    page,
    setPage,
    searchTerm,
    setSearch,
    isLoading,
    error,
    refetch: fetchClients,
    saveClient,
    deleteClient,
  };
};
