import { supabase } from '../lib/supabase';

export interface CreateUserRequest {
  username: string;
  password: string;
  role?: string;
}

export interface CreateUserResponse {
  id: string;
  username: string;
  role: string;
  success: boolean;
}

export const UserManagementService = {
  /**
   * Crea un nuevo usuario en el sistema.
   * La contraseña se hashea con bcrypt via pgcrypto en el servidor.
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse | null> {
    try {
      // Validar entrada
      if (!request.username || !request.password) {
        throw new Error('Usuario y contraseña son requeridos');
      }

      if (request.username.length < 3) {
        throw new Error('El usuario debe tener al menos 3 caracteres');
      }

      if (request.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Llamar a la función RPC para crear el usuario
      const { data, error } = await supabase.rpc('create_user', {
        p_username: request.username.trim().toLowerCase(),
        p_password: request.password,
        p_role: request.role || 'user',
      });

      if (error) {
        console.error('[UserManagementService] Error en RPC create_user:', error.message);
        
        // Detectar errores específicos
        if (error.message.includes('duplicate')) {
          throw new Error('El usuario ya existe');
        }
        throw new Error('Error al crear el usuario. Intenta de nuevo.');
      }

      if (!data || data.length === 0) {
        throw new Error('Error al crear el usuario');
      }

      const user = data[0];
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        success: true,
      };
    } catch (err) {
      console.error('[UserManagementService] Error:', err);
      throw err;
    }
  },

  /**
   * Obtiene la lista de todos los usuarios (solo para admins)
   */
  async listUsers(): Promise<Array<{ id: string; username: string; role: string; activo: boolean; created_at: string }> | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, username, role, activo, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[UserManagementService] Error listando usuarios:', error.message);
        throw new Error('Error al obtener usuarios');
      }

      return data || [];
    } catch (err) {
      console.error('[UserManagementService] Error:', err);
      throw err;
    }
  },

  /**
   * Desactiva un usuario (no lo elimina)
   */
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', userId);

      if (error) {
        console.error('[UserManagementService] Error desactivando usuario:', error.message);
        throw new Error('Error al desactivar usuario');
      }

      return true;
    } catch (err) {
      console.error('[UserManagementService] Error:', err);
      throw err;
    }
  },

  /**
   * Reactiva un usuario desactivado
   */
  async activateUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: true })
        .eq('id', userId);

      if (error) {
        console.error('[UserManagementService] Error activando usuario:', error.message);
        throw new Error('Error al activar usuario');
      }

      return true;
    } catch (err) {
      console.error('[UserManagementService] Error:', err);
      throw err;
    }
  },
};
