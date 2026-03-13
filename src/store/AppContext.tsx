import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ServiceOrder, PaymentTransaction, DeviceCheckInForm, OrderStatus } from '../types';

interface AppContextType {
  orders: ServiceOrder[];
  payments: PaymentTransaction[];
  addOrder: (data: DeviceCheckInForm) => ServiceOrder;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'date'>) => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial mock data
const MOCK_ORDERS: ServiceOrder[] = [
  {
    id: 'ord-1234',
    orderNumber: 'REP-123456',
    customer: { fullName: 'Juan Pérez', documentId: '1712345678', phone: '0987654321' },
    device: { brand: 'Samsung', model: 'Galaxy A54', serialNumber: 'IMEI123456789', deviceType: 'celular', physicalCondition: 'Pantalla rota, rayones en bordes' },
    repair: { reportedIssue: 'Cambio de pantalla', evidencePhotos: [] },
    status: 'diagnostico',
    createdAt: new Date().toISOString()
  }
];

const MOCK_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'pay-1',
    date: new Date().toISOString(),
    amount: 45.0,
    method: 'efectivo',
    type: 'reparacion',
    transactionType: 'ingreso',
    description: 'Abono reparación REP-123456',
    orderId: 'ord-1234'
  },
  {
    id: 'pay-2',
    date: new Date().toISOString(),
    amount: 15.0,
    method: 'transferencia',
    type: 'repuestos',
    transactionType: 'ingreso',
    description: 'Venta de mica de vidrio libre'
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>(MOCK_ORDERS);
  const [payments, setPayments] = useState<PaymentTransaction[]>(MOCK_PAYMENTS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('repair_auth') === 'true';
  });

  const addOrder = (data: DeviceCheckInForm) => {
    const newOrder: ServiceOrder = {
      id: `ord-${Math.random().toString(36).substring(2, 9)}`,
      orderNumber: `REP-${Math.floor(Math.random() * 900000) + 100000}`,
      ...data,
      status: 'recibido',
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);

    if (data.repair.initialDeposit && data.repair.initialDeposit > 0) {
      addPayment({
        amount: data.repair.initialDeposit,
        method: 'efectivo', // defaulting to cash for initial deposit in physical store
        type: 'reparacion',
        transactionType: 'ingreso',
        description: `Abono inicial de reparación orden ${newOrder.orderNumber}`,
        orderId: newOrder.id
      });
    }

    return newOrder;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));
  };

  const addPayment = (paymentData: Omit<PaymentTransaction, 'id' | 'date'>) => {
    const newPayment: PaymentTransaction = {
      id: `pay-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString(),
      ...paymentData
    };
    setPayments(prev => [newPayment, ...prev]);
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
    <AppContext.Provider value={{ orders: orders.filter(o => !o.deleted), payments, addOrder, updateOrderStatus, deleteOrder, addPayment, isAuthenticated, login, logout }}>
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
