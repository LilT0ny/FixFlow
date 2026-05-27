import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  tenant_id?: string;  // NULL si es master admin
  is_master?: boolean; // true si es admin master (dueño del SaaS)
}

export interface Tenant {
  id: string;
  nombre_empresa: string;
  slug: string;
  ruc?: string;
  telefono?: string;
  email: string;
  direccion?: string;
  plan: string;
  activo: boolean;
  created_at: string;
}

export const AuthService = {
  /**
   * Login para Master Admin (dueño del SaaS)
   * Solo accede si role = 'admin' AND tenant_id = NULL
   */
  async loginMaster(username: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username.trim().toLowerCase(),
      p_password: password,
    });

    if (error) {
      console.error('[AuthService] Error en RPC authenticate_user:', error.message);
      throw new Error('Error de conexión. Intenta de nuevo.');
    }

    if (!data || data.length === 0) {
      return null;
    }

    const user = data[0];
    
    // Solo admins sin tenant_id son master admins
    if (user.role !== 'admin' || user.tenant_id !== null) {
      console.warn('[AuthService] Usuario no es master admin');
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
      is_master: true,
    };
  },

  /**
   * Login para usuarios de Tenant (clientes del SaaS)
   */
  async loginTenant(username: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username.trim().toLowerCase(),
      p_password: password,
    });

    if (error) {
      console.error('[AuthService] Error en RPC authenticate_user:', error.message);
      throw new Error('Error de conexión. Intenta de nuevo.');
    }

    if (!data || data.length === 0) {
      return null;
    }

    const user = data[0];
    
    // Debe tener tenant_id (no es master admin)
    if (!user.tenant_id) {
      console.warn('[AuthService] Usuario no es de un tenant');
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
      is_master: false,
    };
  },

  /**
   * Guarda sesión del usuario
   */
  saveSession(user: AuthUser, rememberMe: boolean = false): void {
    const raw = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem('auth_user', raw);
    } else {
      sessionStorage.setItem('auth_user', raw);
    }
  },

  /**
   * Obtiene la sesión actual
   */
  getSession(): AuthUser | null {
    const raw = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Cierra sesión
   */
  clearSession(): void {
    sessionStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user');
  },
};

/**
 * Servicio para gestionar Tenants (solo para Master Admin)
 */
export const TenantService = {
  /**
   * Obtener todos los tenants (solo master admin)
   */
  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TenantService] Error obteniendo tenants:', error.message);
      throw new Error('Error al obtener tenants');
    }

    return (data || []) as Tenant[];
  },

  /**
   * Crear nuevo tenant (cliente/empresa)
   */
  async createTenant(tenant: Omit<Tenant, 'id' | 'created_at' | 'activo'>): Promise<Tenant> {
    // Validar que slug sea único
    if (!tenant.slug.match(/^[a-z0-9-]+$/)) {
      throw new Error('El slug solo puede contener letras minúsculas, números y guiones');
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert([
        {
          nombre_empresa: tenant.nombre_empresa,
          slug: tenant.slug.toLowerCase(),
          ruc: tenant.ruc || null,
          telefono: tenant.telefono || null,
          email: tenant.email,
          direccion: tenant.direccion || null,
          plan: tenant.plan || 'basic',
          activo: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[TenantService] Error creando tenant:', error.message);
      if (error.message.includes('duplicate')) {
        throw new Error('El slug o email ya existe');
      }
      throw new Error('Error al crear tenant');
    }

    return data as Tenant;
  },

  /**
   * Actualizar tenant
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('[TenantService] Error actualizando tenant:', error.message);
      throw new Error('Error al actualizar tenant');
    }

    return data as Tenant;
  },

  /**
   * Desactivar tenant (soft delete)
   */
  async deactivateTenant(tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .update({ activo: false })
      .eq('id', tenantId);

    if (error) {
      console.error('[TenantService] Error desactivando tenant:', error.message);
      throw new Error('Error al desactivar tenant');
    }
  },

  /**
   * Obtener tenant por slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      console.error('[TenantService] Error:', error.message);
      throw new Error('Error al obtener tenant');
    }

    return data as Tenant;
  },
};
