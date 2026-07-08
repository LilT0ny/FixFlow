// src/services/PaymentService.ts
import { supabase } from '../lib/supabase';
import type { PaymentTransaction } from '../types';

/** Ingresos ligados a una nota de venta traen su detalle embebido —
 *  necesario para poder reimprimir la nota desde Transacciones sin
 *  tener que ir a buscarla a otro lado (ese "otro lado" ya no existe). */
const PAYMENT_SELECT = `
  *,
  nota:notas_venta (
    numero_nota,
    cliente:cliente_id (nombre_completo, cedula, telefono, direccion, email),
    items:nota_venta_item (descripcion, cantidad, precio_unitario)
  )
`;

export const PaymentService = {
  /**
   * Obtiene todas las transacciones del tenant (RLS filtra).
   * Ingresos y egresos viven en UNA tabla: transacciones.
   */
  async getPayments(): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('transacciones')
      .select(PAYMENT_SELECT)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => {
      const nota = Array.isArray(t.nota) ? t.nota[0] : t.nota;
      return {
        id: t.id,
        date: t.fecha,
        amount: Number(t.monto),
        method: t.metodo,
        type: t.categoria,
        transactionType: t.tipo,
        description: t.descripcion,
        orderId: t.orden_id ?? undefined,
        saleNumber: nota?.numero_nota,
        customer: nota?.cliente ? {
          fullName: nota.cliente.nombre_completo,
          documentId: nota.cliente.cedula,
          phone: nota.cliente.telefono,
          address: nota.cliente.direccion,
          email: nota.cliente.email,
        } : undefined,
        items: nota?.items?.map((i: { descripcion: string; cantidad: number; precio_unitario: number }, idx: number) => ({
          id: `${t.id}-${idx}`,
          description: i.descripcion,
          quantity: i.cantidad,
          price: Number(i.precio_unitario),
        })),
      };
    });
  },

  /**
   * Guarda una transacción. tenant_id y registrado_por los pone el
   * servidor (defaults + RLS). Un egreso jamás lleva orden/cliente:
   * lo garantiza el CHECK egreso_sin_vinculos.
   */
  async savePayment(paymentData: Partial<PaymentTransaction>): Promise<{ status: string; id: string; message?: string }> {
    try {
      const payload: Record<string, unknown> = {
        tipo: paymentData.transactionType,
        monto: Number(paymentData.amount),
        metodo: paymentData.method,
        categoria: paymentData.type,
        descripcion: paymentData.description || '',
      };

      if (paymentData.transactionType === 'ingreso' && paymentData.orderId) {
        payload.orden_id = paymentData.orderId;
      }

      const { data, error } = await supabase
        .from('transacciones')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { status: 'success', id: data.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { status: 'error', id: '', message: msg };
    }
  }
};
