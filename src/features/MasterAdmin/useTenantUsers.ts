import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { AuthUser } from '../../services/SaaSAuthService';

export interface TenantUser extends AuthUser {
  activo: boolean;
}

interface CreateUserPayload {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'technician';
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
      // Usamos RPC porque la tabla usuarios tiene RLS USING(FALSE)
      const { data, error: err } = await supabase.rpc('get_tenant_users', {
        p_tenant_id: tenantId,
      });
      if (err) throw err;
      setUsers((data || []) as TenantUser[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createUser = useCallback(async (input: CreateUserPayload) => {
    if (!tenantId) throw new Error('No hay tenant seleccionado');
    const { data, error: err } = await supabase.rpc('create_user', {
      p_username: input.username.toLowerCase(),
      p_password: input.password,
      p_role: input.role,
      p_tenant_id: tenantId,
    });
    if (err) throw err;
    await fetchUsers();
    return data?.[0];
  }, [tenantId, fetchUsers]);

  const deactivateUser = useCallback(async (userId: string) => {
    const { error: err } = await supabase.rpc('set_user_active', {
      p_user_id: userId,
      p_activo: false,
    });
    if (err) throw err;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: false } : u));
  }, []);

  const activateUser = useCallback(async (userId: string) => {
    const { error: err } = await supabase.rpc('set_user_active', {
      p_user_id: userId,
      p_activo: true,
    });
    if (err) throw err;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: true } : u));
  }, []);

  return { users, loading, error, fetchUsers, createUser, deactivateUser, activateUser };
}
