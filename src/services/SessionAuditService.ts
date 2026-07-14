// src/services/SessionAuditService.ts
import { supabase } from '../lib/supabase';

export interface SessionEntry {
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  tenantId: string | null;
  tenantNombre: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const SessionAuditService = {
  /**
   * Sesiones de login recientes de todos los tenants (RLS/función restringe
   * a master). Pensado para revisión manual: mismo taller con muchas IPs
   * distintas sugiere credenciales compartidas entre sucursales.
   */
  async getRecentSessions(dias = 30): Promise<SessionEntry[]> {
    const { data, error } = await supabase.rpc('fn_listar_sesiones_recientes', { p_dias: dias });
    if (error) throw error;

    return ((data || []) as Record<string, unknown>[]).map(row => ({
      usuarioId: row.usuario_id as string,
      usuarioNombre: row.usuario_nombre as string,
      usuarioEmail: row.usuario_email as string,
      tenantId: (row.tenant_id as string) || null,
      tenantNombre: (row.tenant_nombre as string) || null,
      ip: (row.ip as string) || null,
      userAgent: (row.user_agent as string) || null,
      createdAt: row.created_at as string,
    }));
  },
};
