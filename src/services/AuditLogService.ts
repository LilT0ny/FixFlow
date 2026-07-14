// src/services/AuditLogService.ts
import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id: number;
  table: string;
  action: 'insert' | 'update' | 'delete';
  actorName: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

const AUDIT_SELECT = `
  *,
  usuario:actor (nombre, email)
`;

export const AuditLogService = {
  /**
   * Últimos 200 eventos de la bitácora (RLS filtra: solo owner/master ven).
   */
  async getAuditLog(): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('bitacora_auditoria')
      .select(AUDIT_SELECT)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      table: row.tabla,
      action: row.accion,
      actorName: row.usuario?.nombre || row.usuario?.email || 'Sistema',
      before: row.datos_antes,
      after: row.datos_despues,
      createdAt: row.created_at,
    }));
  },
};
