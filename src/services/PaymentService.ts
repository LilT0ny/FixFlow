// src/services/PaymentService.ts
import { supabase } from '../lib/supabase';
import type { PaymentTransaction, TransactionType } from '../types';

export const PaymentService = {
  /**
   * Obtiene todas las transacciones históricas desde ambas tablas.
   */
  async getPayments(): Promise<PaymentTransaction[]> {
    const [ingRes, egrRes] = await Promise.all([
      supabase.from('ingresos').select('*').order('fecha', { ascending: false }),
      supabase.from('egresos').select('*').order('fecha', { ascending: false })
    ]);

    if (ingRes.error) throw ingRes.error;
    if (egrRes.error) throw egrRes.error;

    const ingresos = (ingRes.data || []).map(t => ({
      id: t.id.toString(),
      date: t.fecha,
      amount: Number(t.monto),
      method: t.metodo,
      type: t.tipo,
      transactionType: 'ingreso' as TransactionType,
      description: t.descripcion,
      orderId: t.id_orden?.toString()
    }));

    const egresos = (egrRes.data || []).map(t => ({
      id: t.id.toString(),
      date: t.fecha,
      amount: Number(t.monto),
      method: t.metodo,
      type: t.tipo,
      transactionType: 'egreso' as TransactionType,
      description: t.descripcion
    }));

    return [...ingresos, ...egresos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ) as PaymentTransaction[];
  },

  /**
   * Guarda una nueva transacción en la tabla correspondiente (Ingresos o Egresos).
   */
  async savePayment(paymentData: Partial<PaymentTransaction>): Promise<{ status: string; id: string; message?: string }> {
    try {
      const table = paymentData.transactionType === 'ingreso' ? 'ingresos' : 'egresos';
      
      const payload: any = {
        monto: Number(paymentData.amount),
        metodo: paymentData.method,
        tipo: paymentData.type,
        descripcion: paymentData.description,
      };

      // Campos específicos para ingresos
      if (paymentData.transactionType === 'ingreso') {
          payload.id_orden = paymentData.orderId;
      }

      const { data, error } = await supabase
        .from(table)
        .insert(payload)
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

