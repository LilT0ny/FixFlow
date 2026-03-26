// src/services/ClientService.ts
import { supabase } from '../lib/supabase';
import type { CustomerData } from '../types';

export interface Client extends CustomerData {
  id: string;
}

export const ClientService = {
  /**
   * Obtiene la lista completa de clientes registrados.
   */
  async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id.toString(),
      fullName: c.nombre_completo,
      documentId: c.cedula,
      phone: c.telefono,
      address: c.direccion,
      email: c.email
    }));
  },

  /**
   * Guarda o actualiza un cliente.
   */
  async saveClient(client: Client | Omit<Client, 'id'>): Promise<{ status: string; id: string }> {
    const payload = {
      nombre_completo: client.fullName,
      cedula: client.documentId,
      telefono: client.phone,
      direccion: client.address,
      email: client.email
    };

    const { data, error } = await supabase
      .from('clientes')
      .upsert(payload, { onConflict: 'cedula' })
      .select()
      .single();

    if (error) throw error;
    return { status: 'success', id: data.id.toString() };
  },

  /**
   * Elimina un cliente por su ID.
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
