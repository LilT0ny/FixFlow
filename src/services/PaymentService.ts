// src/services/PaymentService.ts
import { supabase } from '../lib/supabase';
import { AuthService } from './SaaSAuthService';
import type { PaymentTransaction, TransactionType } from '../types';

/** Helper: obtiene el tenant_id de la sesión actual */
function getCurrentTenantId(): string | null {
  return AuthService.getCurrentTenantId();
}

export const PaymentService = {
  /**
   * Obtiene todas las transacciones del tenant actual (ingresos + egresos).
   */
  async getPayments(): Promise<PaymentTransaction[]> {
    const tenantId = getCurrentTenantId();

    let ingQuery = supabase.from('ingresos').select('*').order('fecha', { ascending: false });
    let egrQuery = supabase.from('egresos').select('*').order('fecha', { ascending: false });

    if (tenantId) {
      ingQuery = ingQuery.eq('tenant_id', tenantId);
      egrQuery = egrQuery.eq('tenant_id', tenantId);
    }

    const [ingRes, egrRes] = await Promise.all([ingQuery, egrQuery]);

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
   * Guarda una nueva transacción con tenant_id.
   */
  async savePayment(paymentData: Partial<PaymentTransaction>): Promise<{ status: string; id: string; message?: string }> {
    const tenantId = getCurrentTenantId();

    try {
      const table = paymentData.transactionType === 'ingreso' ? 'ingresos' : 'egresos';
      
      const payload: Record<string, unknown> = {
        monto: Number(paymentData.amount),
        metodo: paymentData.method,
        tipo: paymentData.type,
        descripcion: paymentData.description,
      };

      if (paymentData.transactionType === 'ingreso') {
        payload.id_orden = paymentData.orderId;
      }

      if (tenantId) payload.tenant_id = tenantId;

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
