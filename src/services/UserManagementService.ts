import { supabase } from '../lib/supabase';
import { UserService, type UserRole } from './SaaSAuthService';

export interface CreateUserRequest {
  email: string;
  password: string;
  nombre?: string;
  role?: UserRole;
  tenant_id?: string | null;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  role: string;
  success: boolean;
}

export const UserManagementService = {
  /**
   * Crea un nuevo usuario vía Edge Function `create-user` (el admin API
   * de Supabase Auth requiere service role, que jamás toca el navegador).
   * El usuario nace con contraseña temporal y debe_cambiar_password=true.
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse | null> {
    if (!request.email || !request.password) {
      throw new Error('Correo y contraseña son requeridos');
    }
    if (request.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const user = await UserService.createUser({
      email: request.email,
      password: request.password,
      nombre: request.nombre,
      role: request.role || 'member',
      tenant_id: request.tenant_id,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      success: true,
    };
  },

  /**
   * Lista los usuarios visibles para la sesión actual
   * (RLS: owner ve su taller, master ve todos).
   */
  async listUsers(): Promise<Array<{ id: string; email: string; nombre: string; role: string; activo: boolean; created_at: string }> | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, activo, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UserManagementService] Error listando usuarios:', error.message);
      throw new Error('Error al obtener usuarios');
    }

    return (data || []).map(u => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      role: u.rol,
      activo: u.activo,
      created_at: u.created_at,
    }));
  },

  async deactivateUser(userId: string): Promise<boolean> {
    await UserService.setUserActive(userId, false);
    return true;
  },

  async activateUser(userId: string): Promise<boolean> {
    await UserService.setUserActive(userId, true);
    return true;
  },
};
