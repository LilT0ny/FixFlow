import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ServiceOrder, PaymentTransaction, DeviceCheckInForm, OrderStatus } from '../types';
import { useOrders } from '../hooks/useOrders';
import { usePayments } from '../hooks/usePayments';
import { AuthService } from '../services/SaaSAuthService';

interface AppContextType {
  orders: ServiceOrder[];
  payments: PaymentTransaction[];
  addOrder: (data: DeviceCheckInForm) => Promise<ServiceOrder>;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  deleteOrder: (id: string) => void;
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'date'>) => void;
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return AuthService.getSession() !== null;
  });

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

  /**
   * Cuando el usuario se autentica correctamente, re-fetchar todos los datos
   * con el tenant_id ya disponible en sesión.
   * 
   * Esto resuelve el problema de que useOrders/usePayments se montan ANTES
   * del login (sin tenant_id), por lo que su carga inicial no filtra por tenant.
   */
  useEffect(() => {
    if (isAuthenticated) {
      refreshOrders();
      refreshPayments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Combinar acciones: agregar orden + pago de depósito
  const handleAddOrder = async (data: DeviceCheckInForm & { skipIncomeRecord?: boolean }) => {
    const newOrder = await baseAddOrder(data);
    
    if (newOrder.orderNumber.startsWith('REP') && data.repair.initialDeposit && data.repair.initialDeposit > 0 && !data.skipIncomeRecord) {
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

  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      const user = await AuthService.login(username, password);
      if (!user) return false;

      AuthService.saveSession(user, rememberMe);

      // Master admin NO accede al sistema de taller → isAuthenticated queda false
      // para que el ProtectedRoute no lo deje pasar, pero la sesión ya está guardada
      if (!user.is_master && user.tenant_id) {
        setIsAuthenticated(true);
        // El useEffect de arriba dispara refreshOrders + refreshPayments automáticamente
      }

      return true;
    } catch (err) {
      console.error('[login] Error:', err);
      throw err;
    }
  };

  const logout = () => {
    AuthService.clearSession();
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
