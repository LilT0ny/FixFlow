import { useState, useCallback } from 'react';
import { ClientService } from '../../../services/ClientService';
import type { Client } from '../../../services/ClientService';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClientService.getAllClients();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    isLoading,
    error,
    fetchClients,
    saveClient,
    deleteClient,
  };
};
