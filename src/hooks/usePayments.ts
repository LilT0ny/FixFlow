import { useState, useCallback, useEffect } from 'react';
import { PaymentService } from '../services/PaymentService';
import type { PaymentTransaction } from '../types';

export function usePayments() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PaymentService.getPayments();
      // Assume the service returns an array
      if (Array.isArray(data)) {
        setPayments(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = useCallback(async (paymentData: Omit<PaymentTransaction, 'id' | 'date'>) => {
    const tempId = `pay-${crypto.randomUUID().split('-')[0]}`;
    const newPayment: PaymentTransaction = {
      id: tempId,
      date: new Date().toISOString(),
      ...paymentData
    };
    
    try {
      const result = await PaymentService.savePayment(newPayment);
      if (result.status === 'success') {
        const finalPayment = { ...newPayment, id: result.id };
        setPayments(prev => [finalPayment, ...prev]);
        return finalPayment;
      } else {
        throw new Error(result.message || 'Database error while saving payment');
      }
    } catch (err: any) {
      console.error('Error in usePayments addPayment:', err);
      // Depending on app logic, maybe show a toast here
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    addPayment,
    refreshPayments: fetchPayments
  };
}
