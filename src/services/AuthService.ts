import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export const AuthService = {
  /**
   * Intenta autenticar al usuario verificando el hash en la base de datos.
   * La contraseña se verifica con pgcrypto (crypt) en el lado del servidor via RPC.
   */
  async login(username: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username.trim().toLowerCase(),
      p_password: password,
    });

    if (error) {
      console.error('[AuthService] Error en RPC authenticate_user:', error.message);
      throw new Error('Error de conexión. Intenta de nuevo.');
    }

    if (!data || data.length === 0) {
      return null; // Credenciales incorrectas
    }

    const user = data[0];
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  },

  /**
   * Guarda el usuario autenticado.
   * Si rememberMe es true, usa localStorage para persistencia.
   * De lo contrario, usa sessionStorage.
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
   * Obtiene la sesión del usuario actual buscando en sessionStorage y luego en localStorage.
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
   * Cierra la sesión del usuario limpiando ambos almacenamientos.
   */
  clearSession(): void {
    sessionStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user');
  },
};
