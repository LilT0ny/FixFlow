import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ServiceOrder, PaymentTransaction, DeviceCheckInForm, OrderStatus } from '../types';
import { useOrders } from '../hooks/useOrders';
import { usePayments } from '../hooks/usePayments';
import { AuthService, type AuthUser } from '../services/SaaSAuthService';

interface AppContextType {
  orders: ServiceOrder[];
  payments: PaymentTransaction[];
  addOrder: (data: DeviceCheckInForm, kind?: 'REP' | 'NT') => Promise<ServiceOrder>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'date'>) => void;
  authUser: AuthUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Usuario de taller autenticado (el master usa su propio dashboard)
  const isAuthenticated = !!(authUser && !authUser.is_master && authUser.tenant_id);

  const {
    orders,
    addOrder: baseAddOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    refreshOrders,
  } = useOrders();

  const {
    payments,
    addPayment: baseAddPayment,
    refreshPayments,
  } = usePayments();

  // Restaurar sesión de Supabase Auth al montar
  useEffect(() => {
    AuthService.restoreSession()
      .then(setAuthUser)
      .finally(() => setAuthLoading(false));
  }, []);

  // Con sesión de taller activa, cargar datos (RLS ya filtra por tenant)
  useEffect(() => {
    if (isAuthenticated) {
      refreshOrders();
      refreshPayments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // El abono inicial lo registra la RPC crear_orden_completa en transacciones:
  // acá NO se duplica el ingreso.
  const handleAddOrder = async (data: DeviceCheckInForm, kind: 'REP' | 'NT' = 'REP') => {
    const newOrder = await baseAddOrder(data, kind);
    await refreshPayments();
    return newOrder;
  };

  const login = async (email: string, password: string): Promise<AuthUser | null> => {
    const user = await AuthService.login(email, password);
    setAuthUser(user);
    return user;
  };

  const logout = async () => {
    await AuthService.logout();
    setAuthUser(null);
  };

  return (
    <AppContext.Provider value={{
      orders,
      payments,
      addOrder: handleAddOrder,
      updateOrderStatus,
      updateOrder,
      deleteOrder,
      refreshOrders,
      addPayment: baseAddPayment,
      authUser,
      authLoading,
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
