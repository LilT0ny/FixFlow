import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ServiceOrder, PaymentTransaction, DeviceCheckInForm, OrderStatus } from '../types';
import { useOrders } from '../hooks/useOrders';
import { usePayments } from '../hooks/usePayments';

interface AppContextType {
  orders: ServiceOrder[];
  payments: PaymentTransaction[];
  addOrder: (data: DeviceCheckInForm) => Promise<ServiceOrder>;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  deleteOrder: (id: string) => void;
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'date'>) => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('repair_auth') === 'true';
  });

  // Utilize our newly separated Controller Hooks.
  const { 
    orders, 
    addOrder: baseAddOrder, 
    updateOrderStatus, 
    updateOrder, 
    deleteOrder 
  } = useOrders();
  
  const { 
    payments, 
    addPayment: baseAddPayment 
  } = usePayments();

  // Combine actions when adding an order requires a payment deposit
  const handleAddOrder = async (data: DeviceCheckInForm) => {
    const newOrder = await baseAddOrder(data);
    
    // Automatically add payment log if deposit is given
    if (data.repair.initialDeposit && data.repair.initialDeposit > 0) {
      await baseAddPayment({
        amount: data.repair.initialDeposit,
        method: 'efectivo',
        type: 'reparacion',
        transactionType: 'ingreso',
        description: `Abono inicial de reparación orden ${newOrder.orderNumber}`,
        orderId: newOrder.id
      });
    }
    
    return newOrder;
  };

  const login = () => {
    localStorage.setItem('repair_auth', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('repair_auth');
    setIsAuthenticated(false);
  };

  return (
    <AppContext.Provider value={{ 
      orders, 
      payments, 
      addOrder: handleAddOrder, 
      updateOrderStatus, 
      updateOrder, 
      deleteOrder, 
      addPayment: baseAddPayment, 
      isAuthenticated, 
      login, 
      logout 
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
