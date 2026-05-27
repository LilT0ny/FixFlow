// src/services/ClientService.ts
import { supabase } from '../lib/supabase';
import { AuthService } from './SaaSAuthService';
import type { CustomerData } from '../types';

export interface Client extends CustomerData {
  id: string;
}

/** Helper: obtiene el tenant_id de la sesión actual */
function getCurrentTenantId(): string | null {
  return AuthService.getCurrentTenantId();
}

export const ClientService = {
  /**
   * Obtiene la lista completa de clientes del tenant actual.
   */
  async getAllClients(): Promise<Client[]> {
    const tenantId = getCurrentTenantId();

    let query = supabase.from('clientes').select('*').order('nombre_completo', { ascending: true });
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
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
   * Guarda o actualiza un cliente (con tenant_id).
   */
  async saveClient(client: Client | Omit<Client, 'id'>): Promise<{ status: string; id: string }> {
    const tenantId = getCurrentTenantId();

    const payload: Record<string, unknown> = {
      nombre_completo: client.fullName,
      cedula: client.documentId,
      telefono: client.phone,
      direccion: client.address,
      email: client.email
    };
    if (tenantId) payload.tenant_id = tenantId;

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
