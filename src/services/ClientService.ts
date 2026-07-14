// src/services/ClientService.ts
import { supabase } from '../lib/supabase';
import type { CustomerData } from '../types';

export interface Client extends CustomerData {
  id: string;
}

const mapClient = (c: { id: string; nombre_completo: string; cedula: string; telefono: string; direccion?: string; email?: string }): Client => ({
  id: c.id,
  fullName: c.nombre_completo,
  documentId: c.cedula,
  phone: c.telefono,
  address: c.direccion,
  email: c.email,
});

export const ClientService = {
  /**
   * Lista completa de clientes (RLS filtra por tenant) — usado por
   * Exportar (Configuración), que necesita el set entero, no una página.
   */
  async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapClient);
  },

  /**
   * Página de clientes para la vista de tabla, con búsqueda server-side
   * (nombre o cédula) ya que solo hay 20 filas en memoria por página.
   */
  async getPaginated(page: number, pageSize: number, search?: string): Promise<{ clients: Client[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('nombre_completo', { ascending: true });

    const trimmed = search?.trim();
    if (trimmed) {
      query = query.or(`nombre_completo.ilike.%${trimmed}%,cedula.ilike.%${trimmed}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return { clients: (data || []).map(mapClient), total: count || 0 };
  },

  /**
   * Guarda o actualiza un cliente. La cédula es única POR TALLER:
   * el conflicto se resuelve contra (tenant_id, cedula) y el tenant_id
   * lo pone el default del servidor.
   */
  async saveClient(client: Client | Omit<Client, 'id'>): Promise<{ status: string; id: string }> {
    const { data, error } = await supabase
      .from('clientes')
      .upsert({
        nombre_completo: client.fullName,
        cedula: client.documentId,
        telefono: client.phone || '',
        direccion: client.address,
        email: client.email || null
      }, { onConflict: 'tenant_id,cedula' })
      .select()
      .single();

    if (error) throw error;
    return { status: 'success', id: data.id };
  },

  /**
   * Elimina un cliente por su ID (RLS: solo el owner del taller puede borrar).
   */
  async deleteClient(id: string): Promise<{ status: string }> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { status: 'success' };
  },
};
