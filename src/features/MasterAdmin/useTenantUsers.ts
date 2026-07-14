import { useState, useCallback } from 'react';
import { UserService, type AuthUser, type UserRole } from '../../services/SaaSAuthService';
import { UserManagementService } from '../../services/UserManagementService';

export interface TenantUser extends AuthUser {
  activo: boolean;
}

interface CreateUserPayload {
  email: string;
  password: string;
  nombre?: string;
  role?: UserRole;
}

export function useTenantUsers(tenantId: string | null) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      // RLS: master lee usuarios de cualquier tenant; owner los de su taller
      const data = await UserService.getUsersByTenant(tenantId);
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createUser = useCallback(async (input: CreateUserPayload) => {
    if (!tenantId) throw new Error('No hay tenant seleccionado');
    const user = await UserService.createUser({
      email: input.email,
      password: input.password,
      nombre: input.nombre,
      role: input.role || 'member',
      tenant_id: tenantId,
    });
    await fetchUsers();
    return user;
  }, [tenantId, fetchUsers]);

  const deactivateUser = useCallback(async (userId: string) => {
    await UserService.setUserActive(userId, false);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: false } : u));
  }, []);

  const activateUser = useCallback(async (userId: string) => {
    await UserService.setUserActive(userId, true);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: true } : u));
  }, []);

  const updateUser = useCallback(async (userId: string, updates: { email?: string; nombre?: string; role?: UserRole }) => {
    await UserService.updateUser(userId, updates);
    await fetchUsers();
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    await UserManagementService.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  return { users, loading, error, fetchUsers, createUser, deactivateUser, activateUser, updateUser, deleteUser };
}
