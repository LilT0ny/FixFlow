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

export interface TenantSessionSummary {
  tenantId: string;
  tenantNombre: string;
  usuariosDistintos: number;
  totalSesiones: number;
  ipsDistintas: number;
}

export const SessionAuditService = {
  /**
   * Resumen paginado de sesiones por taller (20 talleres por página).
   * Más IPs distintas que usuarios activos sugiere credenciales
   * compartidas entre sucursales.
   */
  async getTenantSessionSummary(page: number, pageSize: number, dias = 30): Promise<{ tenants: TenantSessionSummary[]; total: number }> {
    const { data, error } = await supabase.rpc('fn_listar_tenants_con_sesiones', {
      p_dias: dias,
      p_page: page,
      p_page_size: pageSize,
    });
    if (error) throw error;

    const rows = (data || []) as Record<string, unknown>[];
    const tenants = rows.map(row => ({
      tenantId: row.tenant_id as string,
      tenantNombre: (row.tenant_nombre as string) || 'Sin nombre',
      usuariosDistintos: Number(row.usuarios_distintos),
      totalSesiones: Number(row.total_sesiones),
      ipsDistintas: Number(row.ips_distintas),
    }));

    return { tenants, total: rows.length ? Number(rows[0].total_tenants) : 0 };
  },

  /**
   * Detalle de sesiones de UN taller puntual — se pide recién al
   * expandir esa fila en el panel de Sesiones.
   */
  async getSessionsForTenant(tenantId: string, dias = 30): Promise<SessionEntry[]> {
    const { data, error } = await supabase.rpc('fn_listar_sesiones_recientes', { p_dias: dias, p_tenant_id: tenantId });
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
