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
   * Página de la bitácora (RLS filtra: solo owner/master ven). Sin
   * búsqueda hoy, solo orden descendente por fecha + range.
   */
  async getAuditLog(page: number, pageSize: number): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('bitacora_auditoria')
      .select(AUDIT_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const entries = (data || []).map(row => ({
      id: row.id,
      table: row.tabla,
      action: row.accion,
      actorName: row.usuario?.nombre || row.usuario?.email || 'Sistema',
      before: row.datos_antes,
      after: row.datos_despues,
      createdAt: row.created_at,
    }));

    return { entries, total: count || 0 };
  },
};
