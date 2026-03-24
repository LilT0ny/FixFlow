import { useState, useCallback, useEffect } from 'react';
import { OrderService } from '../services/OrderService';
import type { ServiceOrder, DeviceCheckInForm, OrderStatus } from '../types';

export function useOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await OrderService.getOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrder = useCallback(async (data: DeviceCheckInForm): Promise<ServiceOrder> => {
    const orderNumber = `REP-${Math.floor(Math.random() * 900000) + 100000}`;
    const orderToSave = {
      orderNumber,
      customer: data.customer,
      device: data.device,
      repair: data.repair,
      status: 'recibido'
    };

    try {
      const result = await OrderService.saveOrder(orderToSave);
      if (result.status === 'success') {
        const newOrder: ServiceOrder = {
          id: result.id,
          orderNumber: result.orderNumber,
          customer: data.customer,
          device: data.device,
          repair: data.repair,
          status: 'recibido',
          createdAt: new Date().toISOString()
        };
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
      } else {
        throw new Error(result.message || 'Error in database when saving order');
      }
    } catch (err: any) {
      console.error('Error in useOrders addOrder:', err);
      throw err;
    }
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    // Would usually sync with DB here
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<ServiceOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    // Would usually sync with DB here
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
    // Would usually sync with DB here
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders: orders.filter(o => !o.deleted),
    loading,
    error,
    addOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    refreshOrders: fetchOrders
  };
}
