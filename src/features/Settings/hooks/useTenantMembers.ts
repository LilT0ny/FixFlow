import { useState, useCallback } from 'react';
import { UserManagementService } from '../../../services/UserManagementService';

export interface TenantMember {
  id: string;
  email: string;
  nombre: string;
  role: string;
  activo: boolean;
  created_at: string;
}

/** Miembros del propio taller (RLS ya filtra: owner ve su tenant, master no aplica acá). */
export function useTenantMembers() {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await UserManagementService.listUsers();
      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleActive = useCallback(async (userId: string, activo: boolean) => {
    if (activo) {
      await UserManagementService.deactivateUser(userId);
    } else {
      await UserManagementService.activateUser(userId);
    }
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, activo: !activo } : m));
  }, []);

  const deleteMember = useCallback(async (userId: string) => {
    await UserManagementService.deleteUser(userId);
    setMembers(prev => prev.filter(m => m.id !== userId));
  }, []);

  return { members, loading, error, fetchMembers, toggleActive, deleteMember };
}
