import { supabase } from '../lib/supabase';

// ════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════

export type UserRole = 'master' | 'owner' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  tenant_id: string | null;
  is_master: boolean;
  debe_cambiar_password: boolean;
}

export const isMasterUser = (user: Pick<AuthUser, 'role'>): boolean =>
  user.role === 'master';

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

// ════════════════════════════════════════════════════════════
// AUTH SERVICE — Supabase Auth + perfil en tabla usuarios.
// El aislamiento por tenant lo garantiza RLS en el servidor;
// acá solo se maneja sesión y perfil.
// ════════════════════════════════════════════════════════════

/** Cache del perfil para lecturas síncronas (se refresca en login/getProfile) */
let cachedProfile: AuthUser | null = null;

function mapProfile(row: {
  id: string; email: string; nombre: string; rol: UserRole;
  tenant_id: string | null; debe_cambiar_password: boolean;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    role: row.rol,
    tenant_id: row.tenant_id,
    is_master: row.rol === 'master',
    debe_cambiar_password: row.debe_cambiar_password,
  };
}

export const AuthService = {
  /**
   * Login con email + contraseña (Supabase Auth) y carga del perfil.
   */
  async login(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) return null;
      console.error('[AuthService.login] Error:', error.message);
      throw new Error('Error de autenticación');
    }
    if (!data.user) return null;

    const profile = await this.getProfile();
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Usuario sin perfil o desactivado');
    }
    return profile;
  },

  /**
   * Carga el perfil del usuario autenticado desde la tabla usuarios.
   */
  async getProfile(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      cachedProfile = null;
      return null;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, tenant_id, debe_cambiar_password, activo')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data || !data.activo) {
      cachedProfile = null;
      return null;
    }

    cachedProfile = mapProfile(data);
    return cachedProfile;
  },

  /**
   * Restaura la sesión al montar la app (si existe token válido).
   */
  async restoreSession(): Promise<AuthUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      cachedProfile = null;
      return null;
    }
    return this.getProfile();
  },

  /**
   * Cambio de contraseña (primer login o voluntario).
   * Apaga el flag debe_cambiar_password del perfil.
   */
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('usuarios')
        .update({ debe_cambiar_password: false })
        .eq('id', user.id);
      if (cachedProfile) cachedProfile = { ...cachedProfile, debe_cambiar_password: false };
    }
  },

  async logout(): Promise<void> {
    cachedProfile = null;
    await supabase.auth.signOut();
  },

  /** Perfil cacheado (puede ser null si aún no se restauró la sesión) */
  getCachedProfile(): AuthUser | null {
    return cachedProfile;
  },

  getCurrentTenantId(): string | null {
    return cachedProfile?.tenant_id ?? null;
  },

  isMasterAdmin(): boolean {
    return cachedProfile?.is_master === true;
  },
};

// ════════════════════════════════════════════════════════════
// TENANT SERVICE — CRUD directo; RLS restringe a master
// (lectura de la propia fila para owner/member)
// ════════════════════════════════════════════════════════════

export const TenantService = {
  async getAllTenants(): Promise<Tenant[]> {
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
  },

  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    if (!input.slug.match(/^[a-z0-9-]+$/)) {
      throw new Error('El slug solo puede contener letras minúsculas, números y guiones');
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert({
        nombre_empresa: input.nombre_empresa,
        slug: input.slug.toLowerCase(),
        email: input.email.toLowerCase(),
        ruc: input.ruc || null,
        telefono: input.telefono || null,
        direccion: input.direccion || null,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('slug')) throw new Error('El slug ya existe');
      if (error.message.includes('email')) throw new Error('El email ya está registrado');
      throw error;
    }
    return data as Tenant;
  },

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (error) throw error;
    return (data as Tenant) || null;
  },

  async updateTenant(
    tenantId: string,
    updates: Partial<Omit<Tenant, 'id' | 'created_at'>>,
  ): Promise<Tenant> {
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
};

// ════════════════════════════════════════════════════════════
// USER SERVICE — la creación de usuarios pasa por la Edge
// Function `create-user` (requiere service role para el admin API)
// ════════════════════════════════════════════════════════════

export interface CreateUserInput {
  email: string;
  password: string;
  nombre?: string;
  role: UserRole;
  tenant_id?: string | null;
}

export const UserService = {
  async createUser(input: CreateUserInput): Promise<AuthUser> {
    if (input.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        nombre: input.nombre || '',
        rol: input.role,
        tenant_id: input.tenant_id || null,
      },
    });

    if (error) {
      console.error('[UserService] Error creando usuario:', error.message);
      throw new Error(data?.error || 'Error al crear usuario');
    }
    if (data?.error) throw new Error(data.error);

    return mapProfile(data.usuario);
  },

  async getUsersByTenant(tenantId: string): Promise<(AuthUser & { activo: boolean })[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, tenant_id, debe_cambiar_password, activo')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UserService] Error obteniendo usuarios:', error.message);
      throw new Error('Error al obtener usuarios');
    }
    return (data || []).map((u) => ({ ...mapProfile(u), activo: u.activo }));
  },

  async setUserActive(userId: string, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo })
      .eq('id', userId);

    if (error) {
      console.error('[UserService] Error actualizando usuario:', error.message);
      throw new Error('Error al actualizar usuario');
    }
  },
};
