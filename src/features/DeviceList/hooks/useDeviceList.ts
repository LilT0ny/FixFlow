import { useState, useMemo } from 'react';
import { useOrders } from '../../../hooks/useOrders';
import { usePayments } from '../../../hooks/usePayments';
import type { OrderStatus, ServiceOrder, CustomerData } from '../../../types';

export type FilterTab = 'all' | 'pendientes' | 'reparados' | 'entregados';

export const useDeviceList = () => {
  const { orders, updateOrderStatus, updateOrder, deleteOrder } = useOrders();
  const { payments, addPayment } = usePayments();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  
  const [statusConfirmModal, setStatusConfirmModal] = useState<{ isOpen: boolean, orderId: string, newStatus: OrderStatus } | null>(null);
  
  const [finalAmount, setFinalAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [billingCustomer, setBillingCustomer] = useState<CustomerData | null>(null);

  const [notaVentaConfirmModal, setNotaVentaConfirmModal] = useState<{ isOpen: boolean, order: ServiceOrder } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean, orderId: string } | null>(null);
  const [photosModal, setPhotosModal] = useState<{ isOpen: boolean, orderToEdit: ServiceOrder | null } | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean, order: ServiceOrder } | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filter === 'pendientes' && !['recibido', 'diagnostico', 'esperando_repuestos'].includes(o.status)) return false;
      if (filter === 'reparados' && o.status !== 'listo') return false;
      if (filter === 'entregados' && o.status !== 'entregado') return false;

      if (search) {
        const q = search.toLowerCase();
        if (!o.customer.fullName.toLowerCase().includes(q) && 
            !o.customer.documentId.toLowerCase().includes(q) &&
            !(o.device.serialNumber || '').toLowerCase().includes(q) &&
            !o.orderNumber.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, filter, search]);

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'recibido': return 'Recibido';
      case 'diagnostico': return 'En Diagnóstico';
      case 'esperando_repuestos': return 'Esperando Repuestos';
      case 'listo': return 'Listo para Entrega';
      case 'entregado': return 'Entregado';
      default: return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'recibido': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'diagnostico': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'esperando_repuestos': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'listo': return 'bg-success-100 text-success-800 border-success-200';
      case 'entregado': return 'bg-surface-100 text-surface-800 border-surface-200';
      default: return 'bg-surface-100 text-surface-800';
    }
  };

  const getPagado = (orderId: string) => {
    return payments.filter(p => p.orderId === orderId && p.transactionType === 'ingreso').reduce((sum, p) => sum + p.amount, 0);
  };

  const notifyWhatsApp = (order: ServiceOrder, statusText: string) => {
    let phoneNumber = order.customer.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '593' + phoneNumber.substring(1);
    }
    const message = `Hola ${order.customer.fullName}, te informamos que tu ${order.device.brand} ${order.device.model} se encuentra en estado: ${statusText}.`;
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const confirmStatusChange = () => {
    if (!statusConfirmModal) return;
    const { orderId, newStatus } = statusConfirmModal;
    
    updateOrderStatus(orderId, newStatus);
    
    if (billingCustomer) {
      updateOrder(orderId, { billingCustomer });
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (orderToUpdate && billingCustomer.documentId !== '9999999999999') {
        const hasNewAddress = billingCustomer.address && billingCustomer.address !== orderToUpdate.customer.address;
        const hasNewEmail = billingCustomer.email && billingCustomer.email !== orderToUpdate.customer.email;
        if (hasNewAddress || hasNewEmail) {
          if (window.confirm("¿Deseas guardar permanentemente esta información adicional en la ficha del cliente original?")) {
            updateOrder(orderId, { 
              customer: { 
                ...orderToUpdate.customer, 
                address: billingCustomer.address || orderToUpdate.customer.address, 
                email: billingCustomer.email || orderToUpdate.customer.email 
              } 
            });
          }
        }
      }
    }

    if (newStatus === 'entregado' && typeof finalAmount === 'number') {
      const pagado = getPagado(orderId);
      const saldo = finalAmount - pagado;
      if (saldo > 0) {
        addPayment({
          amount: saldo,
          method: paymentMethod,
          type: 'reparacion',
          transactionType: 'ingreso',
          description: `Cobro final de reparación de orden ${orders.find(o => o.id === orderId)?.orderNumber || ''}`,
          orderId
        });
      }
    }
    
    const orderToNotify = orders.find(o => o.id === orderId);
    if (orderToNotify) {
      notifyWhatsApp(orderToNotify, getStatusLabel(newStatus));
    }
    
    setStatusConfirmModal(null);
    setFinalAmount('');
    setBillingCustomer(null);
  };

  const processFileUpload = (order: ServiceOrder, stage: 'antes' | 'durante' | 'despues', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_WIDTH) { width *= MAX_WIDTH / height; height = MAX_WIDTH; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        const currentPhotos = order.repair.evidencePhotos || [];
        const newPhotos = [...currentPhotos, { stage, url: resizedBase64 }];
        updateOrder(order.id, { repair: { ...order.repair, evidencePhotos: newPhotos } });
        setPhotosModal({ isOpen: true, orderToEdit: { ...order, repair: { ...order.repair, evidencePhotos: newPhotos } } });
      };
    };
    reader.readAsDataURL(file);
  };

  return {
    orders, filteredOrders, filter, setFilter, search, setSearch,
    isPrintModalOpen, setIsPrintModalOpen, orderToPrint, setOrderToPrint,
    statusConfirmModal, setStatusConfirmModal,
    finalAmount, setFinalAmount, paymentMethod, setPaymentMethod, billingCustomer, setBillingCustomer,
    notaVentaConfirmModal, setNotaVentaConfirmModal,
    deleteConfirmModal, setDeleteConfirmModal,
    photosModal, setPhotosModal,
    editModal, setEditModal,
    getStatusLabel, getStatusColor, notifyWhatsApp, confirmStatusChange, getPagado, processFileUpload,
    updateOrder, deleteOrder, confirmDelete: () => {
      if (deleteConfirmModal) {
        deleteOrder(deleteConfirmModal.orderId);
        setDeleteConfirmModal(null);
      }
    }
  };
};
