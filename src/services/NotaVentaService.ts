// src/services/NotaVentaService.ts
import { supabase } from '../lib/supabase';

export interface SalesNote {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  metodoPago: string;
  total: number;
}

const NOTA_SELECT = `
  *,
  cliente:cliente_id (nombre_completo),
  items:nota_venta_item (cantidad, precio_unitario)
`;

export const NotaVentaService = {
  /**
   * Obtiene todas las notas de venta activas (RLS filtra por tenant).
   * El total no vive en la tabla: se calcula sumando sus ítems.
   */
  async getAllSalesNotes(): Promise<SalesNote[]> {
    const { data, error } = await supabase
      .from('notas_venta')
      .select(NOTA_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(n => {
      const items: { cantidad: number; precio_unitario: number }[] = n.items || [];
      const total = items.reduce((sum, i) => sum + i.cantidad * Number(i.precio_unitario), 0);

      return {
        id: n.id,
        numero: n.numero_nota,
        fecha: n.created_at,
        cliente: n.cliente?.nombre_completo || 'Consumidor final',
        metodoPago: n.metodo_pago,
        total,
      };
    });
  },
};
