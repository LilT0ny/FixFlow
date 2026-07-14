// src/services/RepuestoService.ts
import { supabase } from '../lib/supabase';

export interface Repuesto {
  id: string;
  nombre: string;
  sku: string | null;
  costo: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  activo: boolean;
}

export interface MovimientoInventario {
  id: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  registradoPor: string;
  createdAt: string;
}

const mapRepuesto = (r: Record<string, unknown>): Repuesto => ({
  id: r.id as string,
  nombre: r.nombre as string,
  sku: (r.sku as string) || null,
  costo: Number(r.costo),
  precioVenta: Number(r.precio_venta),
  stock: Number(r.stock),
  stockMinimo: Number(r.stock_minimo),
  activo: r.activo as boolean,
});

export const RepuestoService = {
  /**
   * Catálogo completo (RLS filtra por tenant).
   */
  async getAll(): Promise<Repuesto[]> {
    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapRepuesto);
  },

  /**
   * Búsqueda por nombre o sku, para el picker de Notas de Venta.
   */
  async search(query: string): Promise<Repuesto[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const { data, error } = await supabase
      .from('repuestos')
      .select('*')
      .eq('activo', true)
      .or(`nombre.ilike.%${trimmed}%,sku.ilike.%${trimmed}%`)
      .order('nombre', { ascending: true })
      .limit(8);

    if (error) throw error;
    return (data || []).map(mapRepuesto);
  },

  async create(input: { nombre: string; sku?: string; costo: number; precioVenta: number; stock: number; stockMinimo: number }): Promise<Repuesto> {
    const { data, error } = await supabase
      .from('repuestos')
      .insert({
        nombre: input.nombre.trim(),
        sku: input.sku?.trim() || null,
        costo: input.costo,
        precio_venta: input.precioVenta,
        stock: input.stock,
        stock_minimo: input.stockMinimo,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRepuesto(data);
  },

  async update(id: string, updates: { nombre: string; sku?: string; costo: number; precioVenta: number; stockMinimo: number }): Promise<Repuesto> {
    const { data, error } = await supabase
      .from('repuestos')
      .update({
        nombre: updates.nombre.trim(),
        sku: updates.sku?.trim() || null,
        costo: updates.costo,
        precio_venta: updates.precioVenta,
        stock_minimo: updates.stockMinimo,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRepuesto(data);
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase.from('repuestos').update({ activo: false }).eq('id', id);
    if (error) throw error;
  },

  /**
   * Reposición/ajuste manual de stock, con motivo auditado (fn_ajustar_stock).
   */
  async adjustStock(repuestoId: string, cantidad: number, motivo: string): Promise<void> {
    const { error } = await supabase.rpc('fn_ajustar_stock', {
      p_repuesto_id: repuestoId,
      p_cantidad: cantidad,
      p_motivo: motivo,
    });
    if (error) throw error;
  },

  async getMovements(repuestoId: string): Promise<MovimientoInventario[]> {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select('*, usuario:registrado_por (nombre, email)')
      .eq('repuesto_id', repuestoId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []).map(m => ({
      id: m.id,
      tipo: m.tipo,
      cantidad: Number(m.cantidad),
      motivo: m.motivo,
      registradoPor: m.usuario?.nombre || m.usuario?.email || 'Sistema',
      createdAt: m.created_at,
    }));
  },
};
