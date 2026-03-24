import { apiClient } from './apiClient';
import type { PaymentTransaction } from '../types';

export const PaymentService = {
  async getPayments(): Promise<PaymentTransaction[]> {
    return apiClient.get<PaymentTransaction[]>('/get_payments.php');
  },

  async savePayment(paymentData: PaymentTransaction): Promise<{ status: string, id: string, message?: string }> {
    return apiClient.post('/save_payment.php', paymentData);
  }
};
