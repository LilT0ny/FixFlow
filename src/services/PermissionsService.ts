import { supabase } from '../lib/supabase';
import type { ModuleKey } from '../constants/modules';

export const PermissionsService = {
  /**
   * Módulos habilitados para un usuario. `null` = sin fila en permisos_modulo
   * todavía (miembro nunca configurado) → se trata como acceso total, para
   * no bloquear de golpe a miembros creados antes de esta función.
   */
  async getModules(userId: string): Promise<ModuleKey[] | null> {
    const { data, error } = await supabase
      .from('permisos_modulo')
      .select('modulo')
      .eq('usuario_id', userId);

    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data.map(r => r.modulo as ModuleKey);
  },

  /** Reemplaza por completo los módulos habilitados de un miembro (alcance 'taller'). */
  async setModules(userId: string, modules: ModuleKey[]): Promise<void> {
    const { error: delError } = await supabase.from('permisos_modulo').delete().eq('usuario_id', userId);
    if (delError) throw delError;

    if (modules.length === 0) return;

    const { error: insError } = await supabase
      .from('permisos_modulo')
      .insert(modules.map(modulo => ({ usuario_id: userId, modulo, alcance: 'taller' })));
    if (insError) throw insError;
  },
};
