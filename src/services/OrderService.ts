import { apiClient } from './apiClient';
import type { ServiceOrder } from '../types';

export const OrderService = {
  async getOrders(): Promise<ServiceOrder[]> {
    return apiClient.get<ServiceOrder[]>('/get_orders.php');
  },

  async saveOrder(orderData: any): Promise<{ status: string, id: string, orderNumber: string, message?: string }> {
    return apiClient.post('/save_order.php', orderData);
  }
};
