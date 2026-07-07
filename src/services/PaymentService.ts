// src/services/PaymentService.ts
import { supabase } from '../lib/supabase';
import type { PaymentTransaction } from '../types';

export const PaymentService = {
  /**
   * Obtiene todas las transacciones del tenant (RLS filtra).
   * Ingresos y egresos viven en UNA tabla: transacciones.
   */
  async getPayments(): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      date: t.fecha,
      amount: Number(t.monto),
      method: t.metodo,
      type: t.categoria,
      transactionType: t.tipo,
      description: t.descripcion,
      orderId: t.orden_id ?? undefined,
    }));
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
