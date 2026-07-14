// src/services/GrupoService.ts
import { supabase } from '../lib/supabase';

export interface GrupoEmpresarial {
  id: string;
  nombre: string;
}

export const GrupoService = {
  /**
   * Lista de grupos empresariales (cadenas). RLS restringe a master.
   */
  async getAllGroups(): Promise<GrupoEmpresarial[]> {
    const { data, error } = await supabase
      .from('grupos_empresariales')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createGroup(nombre: string): Promise<GrupoEmpresarial> {
    const { data, error } = await supabase
      .from('grupos_empresariales')
      .insert({ nombre: nombre.trim() })
      .select('id, nombre')
      .single();

    if (error) throw error;
    return data;
  },
};
