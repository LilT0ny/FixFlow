// src/services/PaymentService.ts
import { supabase } from '../lib/supabase';
import type { PaymentTransaction } from '../types';

export const PaymentService = {
  /**
   * Obtiene todas las transacciones históricas.
   */
  async getPayments(): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id.toString(),
      date: t.fecha,
      amount: Number(t.monto),
      method: t.metodo,
      type: t.tipo,
      transactionType: t.tipo_transaccion,
      description: t.descripcion,
      orderId: t.id_orden?.toString()
    })) as PaymentTransaction[];
  },

  /**
   * Guarda una nueva transacción (Ingreso o Egreso).
   */
  async savePayment(paymentData: Partial<PaymentTransaction>): Promise<{ status: string; id: string; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .insert({
          monto: Number(paymentData.amount),
          metodo: paymentData.method,
          tipo: paymentData.type,
          tipo_transaccion: paymentData.transactionType,
          descripcion: paymentData.description,
          id_orden: paymentData.orderId ? Number(paymentData.orderId) : null
        })
        .select()
        .single();

      if (error) throw error;
      return { status: 'success', id: data.id.toString() };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { status: 'error', id: '', message: msg };
    }
  }
};

