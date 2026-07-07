import { supabase } from '../lib/supabase';

// ════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  tenant_id?: string | null;
  is_master?: boolean;
}

/**
 * Un usuario es master si su rol lo dice (fuente de verdad: la base de datos).
 * Se mantiene el caso legacy "admin sin tenant" para sesiones anteriores a la migración SaaS.
 */
export const isMasterUser = (user: Pick<AuthUser, 'role' | 'tenant_id'>): boolean =>
  user.role === 'master' || (!user.tenant_id && user.role === 'admin');

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
  updated_at: string;
}

export interface CreateTenantInput {
  nombre_empresa: string;
  slug: string;
  email: string;
  ruc?: string;
  telefono?: string;
  direccion?: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'technician';
  tenant_id?: string | null;
}

// ════════════════════════════════════════════════════════════
// AUTH SERVICE - Maneja login de Master Admin y Tenants
// ════════════════════════════════════════════════════════════

export const AuthService = {
  /**
   * Login unificado: detecta automáticamente si es master o tenant user
   */
  async login(username: string, password: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username.trim().toLowerCase(),
        p_password: password,
      });

      if (error) {
        console.error('[AuthService] Error en RPC authenticate_user:', error.message);
        throw new Error('Error de autenticación');
      }

      if (!data || data.length === 0) {
        return null;
      }

      const user = data[0];
      const isMaster = isMasterUser(user);

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        tenant_id: isMaster ? null : (user.tenant_id || null),
        is_master: isMaster,
      };
    } catch (error) {
      console.error('[AuthService.login] Error:', error);
      throw error;
    }
  },

  /**
   * Guarda sesión del usuario en localStorage o sessionStorage
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
   * Obtiene la sesión actual del usuario.
   * Invalida sesiones viejas (pre-migración SaaS) que no tienen tenant_id.
   */
  getSession(): AuthUser | null {
    const raw = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as AuthUser;

      // Master admin: derivado del rol guardado en la sesión, nunca de un ID hardcodeado
      if (user && isMasterUser(user)) {
        user.is_master = true;
        user.tenant_id = null;
        return user;
      }

      // Sesión vieja (pre-migración): no tiene tenant_id → forzar re-login
      if (user && !user.is_master && !user.tenant_id) {
        console.warn('[AuthService] Sesión sin tenant_id detectada — invalidando para re-login');
        sessionStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user');
        return null;
      }

      return user;
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

  /**
   * Valida que la sesión actual sea master admin
   */
  isMasterAdmin(): boolean {
    const session = this.getSession();
    return session?.is_master === true;
  },

  /**
   * Valida que la sesión actual sea de un tenant
   */
  isTenantUser(): boolean {
    const session = this.getSession();
    return !!(session?.tenant_id && !session?.is_master);
  },

  /**
   * Obtiene el tenant_id de la sesión actual
   */
  getCurrentTenantId(): string | null {
    const session = this.getSession();
    return session?.tenant_id || null;
  },
};

// ════════════════════════════════════════════════════════════
// TENANT SERVICE - Gestiona tenants (solo master admin)
// ════════════════════════════════════════════════════════════

export const TenantService = {
  /**
   * Obtener todos los tenants (solo master admin)
   */
  async getAllTenants(): Promise<Tenant[]> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TenantService] Error obteniendo tenants:', error.message);
        throw new Error('Error al obtener tenants');
      }

      return (data || []) as Tenant[];
    } catch (error) {
      console.error('[TenantService.getAllTenants] Error:', error);
      throw error;
    }
  },

  /**
   * Crear nuevo tenant (cliente/empresa)
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    try {
      // Validar slug
      if (!input.slug.match(/^[a-z0-9-]+$/)) {
        throw new Error('El slug solo puede contener letras minúsculas, números y guiones');
      }

      const { data, error } = await supabase.rpc('create_tenant', {
        p_nombre_empresa: input.nombre_empresa,
        p_slug: input.slug.toLowerCase(),
        p_email: input.email.toLowerCase(),
        p_ruc: input.ruc || null,
        p_telefono: input.telefono || null,
        p_direccion: input.direccion || null,
      });

      if (error) {
        console.error('[TenantService] Error creando tenant:', error.message);
        if (error.message.includes('slug')) {
          throw new Error('El slug ya existe');
        }
        if (error.message.includes('email')) {
          throw new Error('El email ya está registrado');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Error al crear tenant');
      }

      return data[0] as Tenant;
    } catch (error) {
      console.error('[TenantService.createTenant] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener tenant por ID
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as Tenant;
    } catch (error) {
      console.error('[TenantService.getTenantById] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener tenant por slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as Tenant;
    } catch (error) {
      console.error('[TenantService.getTenantBySlug] Error:', error);
      throw error;
    }
  },

  /**
   * Actualizar tenant
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<Omit<Tenant, 'id' | 'created_at'>>,
  ): Promise<Tenant> {
    try {
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
    } catch (error) {
      console.error('[TenantService.updateTenant] Error:', error);
      throw error;
    }
  },

  /**
   * Desactivar tenant (soft delete)
   */
  async deactivateTenant(tenantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ activo: false })
        .eq('id', tenantId);

      if (error) {
        console.error('[TenantService] Error desactivando tenant:', error.message);
        throw new Error('Error al desactivar tenant');
      }
    } catch (error) {
      console.error('[TenantService.deactivateTenant] Error:', error);
      throw error;
    }
  },
};

// ════════════════════════════════════════════════════════════
// USER SERVICE - Gestiona usuarios (master admin crea para tenants)
// ════════════════════════════════════════════════════════════

export const UserService = {
  /**
   * Crear usuario (master admin crea para tenants o para sí mismo)
   */
  async createUser(input: CreateUserInput): Promise<AuthUser> {
    try {
      // Validaciones
      if (input.username.length < 3) {
        throw new Error('El usuario debe tener al menos 3 caracteres');
      }

      if (input.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      const { data, error } = await supabase.rpc('create_user', {
        p_username: input.username.toLowerCase(),
        p_password: input.password,
        p_role: input.role,
        p_tenant_id: input.tenant_id || null,
      });

      if (error) {
        console.error('[UserService] Error creando usuario:', error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Error al crear usuario');
      }

      const user = data[0];
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id || null,
        is_master: isMasterUser(user),
      };
    } catch (error) {
      console.error('[UserService.createUser] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener usuarios de un tenant (solo master admin)
   */
  async getUsersByTenant(tenantId: string): Promise<AuthUser[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, username, role, tenant_id, activo')
        .eq('tenant_id', tenantId)
        .eq('activo', true);

      if (error) {
        console.error('[UserService] Error obteniendo usuarios:', error.message);
        throw new Error('Error al obtener usuarios');
      }

      return (data || []).map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        tenant_id: u.tenant_id || null,
      }));
    } catch (error) {
      console.error('[UserService.getUsersByTenant] Error:', error);
      throw error;
    }
  },

  /**
   * Desactivar usuario
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', userId);

      if (error) {
        console.error('[UserService] Error desactivando usuario:', error.message);
        throw new Error('Error al desactivar usuario');
      }
    } catch (error) {
      console.error('[UserService.deactivateUser] Error:', error);
      throw error;
    }
  },

  /**
   * Activar usuario
   */
  async activateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: true })
        .eq('id', userId);

      if (error) {
        console.error('[UserService] Error activando usuario:', error.message);
        throw new Error('Error al activar usuario');
      }
    } catch (error) {
      console.error('[UserService.activateUser] Error:', error);
      throw error;
    }
  },
};
