import { useState, useEffect, useCallback } from 'react';
import type { AuthUser, Tenant } from '../services/SaaSAuthService';
import { AuthService, TenantService } from '../services/SaaSAuthService';

// ════════════════════════════════════════════════════════════
// useAuth - Hook para manejar autenticación
// ════════════════════════════════════════════════════════════

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión al montar
    const session = AuthService.getSession();
    setUser(session);
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const loggedInUser = await AuthService.login(username, password);
      if (!loggedInUser) {
        setUser(null);
        throw new Error('Usuario o contraseña incorrectos');
      }

      AuthService.saveSession(loggedInUser, true);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.clearSession();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isMaster: user?.is_master || false,
    isTenant: !!(user?.tenant_id && !user?.is_master),
  };
};

// ════════════════════════════════════════════════════════════
// useTenants - Hook para gestionar tenants (master admin)
// ════════════════════════════════════════════════════════════

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TenantService.getAllTenants();
      setTenants(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const createTenant = useCallback(
    async (input: Parameters<typeof TenantService.createTenant>[0]) => {
      try {
        const newTenant = await TenantService.createTenant(input);
        setTenants((prev) => [newTenant, ...prev]);
        return newTenant;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const getTenantById = useCallback(async (id: string) => {
    try {
      return await TenantService.getTenantById(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      throw err;
    }
  }, []);

  const deactivateTenant = useCallback(async (id: string) => {
    try {
      await TenantService.deactivateTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      throw err;
    }
  }, []);

  return {
    tenants,
    loading,
    error,
    fetchTenants,
    createTenant,
    getTenantById,
    deactivateTenant,
  };
};
