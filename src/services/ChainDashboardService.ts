// src/services/ChainDashboardService.ts
import { supabase } from '../lib/supabase';

export interface BranchStats {
  tenantId: string;
  sucursal: string;
  ordenesActivas: number;
  ingresosMes: number;
  egresosMes: number;
}

export const ChainDashboardService = {
  /**
   * Números agregados por sucursal del grupo empresarial del tenant actual.
   * Devuelve [] si el tenant no pertenece a ningún grupo — el RPC resuelve
   * todo server-side contra la sesión, sin exponer filas crudas de otro tenant.
   */
  async getChainDashboard(): Promise<BranchStats[]> {
    const { data, error } = await supabase.rpc('fn_dashboard_grupo');
    if (error) throw error;

    return ((data || []) as Record<string, unknown>[]).map(row => ({
      tenantId: row.tenant_id as string,
      sucursal: row.sucursal as string,
      ordenesActivas: Number(row.ordenes_activas),
      ingresosMes: Number(row.ingresos_mes),
      egresosMes: Number(row.egresos_mes),
    }));
  },
};
