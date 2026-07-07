import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrders } from '../../../hooks/useOrders';
import { useSettings } from '../../../hooks/useSettings';
import { PaymentService } from '../../../services/PaymentService';
import { uploadPhoto, deletePhoto } from '../../../services/StorageService';
import type { OrderStatus, ServiceOrder, CustomerData, DeviceCheckInForm } from '../../../types';

export const useDeviceList = () => {
  const { orders, updateOrderStatus, updateOrder, deleteOrder } = useOrders();
  const { settings } = useSettings();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatuses: OrderStatus[] = useMemo(() => {
    const statusParam = searchParams.get('status');
    if (!statusParam) return [];
    return statusParam.split(',') as OrderStatus[];
  }, [searchParams]);

  const toggleStatus = (status: OrderStatus) => {
    const newStatuses = activeStatuses.includes(status)
      ? activeStatuses.filter(s => s !== status)
      : [...activeStatuses, status];
    const newParams = new URLSearchParams(searchParams);
    if (newStatuses.length === 0) {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatuses.join(','));
    }
    setSearchParams(newParams);
  };

  const clearStatuses = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('status');
    setSearchParams(newParams);
  };

  const [search, setSearch] = useState('');

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [isPrintModalOpen, setIsPrintModalOpen]     = useState(false);
  const [orderToPrint,     setOrderToPrint]         = useState<ServiceOrder | null>(null);

  const [statusConfirmModal, setStatusConfirmModal] = useState<{
    isOpen: boolean; orderId: string; newStatus: OrderStatus;
  } | null>(null);

  /** Método de pago capturado al entregar */
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  /** Flag para indicar si se desea generar Nota de Venta (NV) al entregar */
  const [generateSalesNote, setGenerateSalesNote] = useState(false);
  /** Datos de facturación opcionales para nota de venta */
  const [billingCustomer, setBillingCustomer] = useState<CustomerData | null>(null);
  /** Flag para mostrar spinner mientras se guarda el state change */
  const [isConfirming, setIsConfirming] = useState(false);
  /** Mensaje de éxito tras operación exitosa en BD — se auto-limpia en 3s */
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const deleteConfirmModal_state = useState<{ isOpen: boolean; orderId: string } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = deleteConfirmModal_state;
  const [photosModal,        setPhotosModal]        = useState<{ isOpen: boolean; orderToEdit: ServiceOrder | null } | null>(null);
  const [editModal,          setEditModal]          = useState<{ isOpen: boolean; order: ServiceOrder } | null>(null);

  /** Muestra un mensaje de éxito por 3 segundos y luego lo limpia */
  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  }, []);

  const { addOrder } = useOrders();

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // SOLO MOSTRAR REPARACIONES (REP)
      const isRepair = o.orderNumber.startsWith('REP');
      if (!isRepair) return false;

      if (activeStatuses.length > 0 && !activeStatuses.includes(o.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !o.customer.fullName.toLowerCase().includes(q) &&
          !o.customer.documentId.toLowerCase().includes(q) &&
          !(o.device?.serialNumber || '').toLowerCase().includes(q) &&
          !o.orderNumber.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [orders, activeStatuses, search]);

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':            return 'Recibido';
      case 'diagnostico':         return 'En Diagnóstico';
      case 'esperando_repuestos': return 'Esperando Repuestos';
      case 'listo':               return 'Listo para Entrega';
      case 'entregado':           return 'Entregado';
      default:                    return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'recibido':            return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'diagnostico':         return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'esperando_repuestos': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'listo':               return 'bg-success-100 text-success-800 border-success-200';
      case 'entregado':           return 'bg-surface-100 text-surface-800 border-surface-200';
      default:                    return 'bg-surface-100 text-surface-800';
    }
  };

  const notifyWhatsApp = (order: ServiceOrder, statusText: string) => {
    let phoneNumber = order.customer.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '593' + phoneNumber.substring(1);
    }

    const total = Number(order.repair.repairTotalCost) || 0;
    const abono = Number(order.repair.initialDeposit) || 0;
    const saldo = total - abono;

    const msg = settings.whatsappTemplate
      .replace(/{{customer}}/g, order.customer.fullName)
      .replace(/{{device}}/g, order.device?.brand || 'GENERAL')
      .replace(/{{model}}/g, order.device?.model || 'N/A')
      .replace(/{{status}}/g, statusText)
      .replace(/{{orderNumber}}/g, order.orderNumber)
      .replace(/{{total}}/g, total.toFixed(2))
      .replace(/{{abono}}/g, abono.toFixed(2))
      .replace(/{{saldo}}/g, saldo.toFixed(2));

    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  /**
   * Confirma el cambio de estado.
   * - Para "entregado": lee costos directamente del objeto de la orden (sin input manual).
   * - Llama a la BD antes de resetear el modal → si falla, el modal permanece abierto.
   * - Dispara WhatsApp solo para estados distintos de "entregado".
   */
  const confirmStatusChange = async () => {
    if (!statusConfirmModal) return;
    const { orderId, newStatus } = statusConfirmModal;
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    setIsConfirming(true);
    try {
      await updateOrderStatus(orderId, newStatus);

      // Guardar billingCustomer si aplica
      if (billingCustomer && newStatus === 'entregado') {
        await updateOrder(orderId, { billingCustomer });
      }

      // Registro financiero del cobro final
      const total = Number(currentOrder.repair.repairTotalCost) || 0;
      const abono = Number(currentOrder.repair.initialDeposit)  || 0;
      const saldo = total - abono;

      if (newStatus === 'entregado') {
        // El abono inicial ya generó su ingreso al crear la orden; al entregar,
        // lo que entra en caja es el SALDO pendiente — siempre, con o sin nota.
        if (saldo > 0) {
          await PaymentService.savePayment({
            amount: saldo,
            method: paymentMethod as 'efectivo' | 'transferencia',
            type: 'reparacion',
            transactionType: 'ingreso',
            description: `COBRO FINAL - ORDEN #${currentOrder.orderNumber}`,
            orderId: currentOrder.id,
            customer: billingCustomer || currentOrder.customer
          });
        }

        // AUTO-GENERAR NOTA DE VENTA (NT) SI SE SOLICITÓ
        // La nota es un DOCUMENTO para el cliente: detalla el total, pero no
        // registra ingreso (skipIncomeRecord) — la caja ya cuadra con abono + saldo.
        if (generateSalesNote) {
          const description = `REPARACIÓN: ${currentOrder.device?.brand} ${currentOrder.device?.model} - ${currentOrder.repair.reportedIssue}`;
          await addOrder({
            customer: billingCustomer || currentOrder.customer,
            repair: {
              reportedIssue: description,
              initialDeposit: total,
              repairTotalCost: total,
              evidencePhotos: []
            },
            paymentMethod: paymentMethod,
            skipIncomeRecord: true
          } as DeviceCheckInForm & { paymentMethod: string; skipIncomeRecord: boolean }, 'NT');
        }
      }

      // Notificar WhatsApp solo si no es entregado (para evitar doble apertura con impresión)
      if (newStatus !== 'entregado') {
        notifyWhatsApp(currentOrder, getStatusLabel(newStatus));
      }

      // Si se solicitó nota de venta, abrir modal de impresión
      if (generateSalesNote && newStatus === 'entregado') {
        setOrderToPrint({ ...currentOrder, status: 'entregado', billingCustomer: billingCustomer || currentOrder.customer });
        setIsPrintModalOpen(true);
      }
      
      // Solo cerramos el modal y limpiamos si la operación fue exitosa
      setStatusConfirmModal(null);
      setPaymentMethod('efectivo');
      setBillingCustomer(null);
      setGenerateSalesNote(false);
      
      showSuccess(`✓ Equipo entregado y estado actualizado en la base de datos.`);
    } catch (err) {
      console.error('Error en confirmStatusChange:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Procesa la subida de fotos de evidencia, redimensiona a máx. 800px, 
   * sube a Supabase Storage y actualiza la orden.
   */
  const processFileUpload = async (order: ServiceOrder, stage: 'antes' | 'durante' | 'despues', file: File) => {
    // Primero redimensionamos la imagen localmente para optimizar el tamaño
    const resizedBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const img = new Image();
        img.src = base64String;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let { width, height } = img;
          if (width > height) {
            if (width > MAX) { height *= MAX / width; width = MAX; }
          } else {
            if (height > MAX) { width *= MAX / height; height = MAX; }
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          const resized = canvas.toDataURL('image/jpeg', 0.7);
          resolve(resized);
        };
      };
      reader.readAsDataURL(file);
    });

    // Convertir base64 a File para subir a Storage
    const base64ToBlob = async (dataUrl: string): Promise<Blob> => {
      const response = await fetch(dataUrl);
      return response.blob();
    };

    const blob = await base64ToBlob(resizedBase64);
    const resizedFile = new File([blob], `evidence_${stage}_${Date.now()}.jpg`, { type: 'image/jpeg' });

    try {
      // Subir la foto a Supabase Storage
      const publicUrl = await uploadPhoto(resizedFile, order.id, stage);
      
      // Actualizar la orden con la URL de Supabase
      const newPhotos = [...(order.repair.evidencePhotos || []), { stage, url: publicUrl }];
      await updateOrder(order.id, { repair: { ...order.repair, evidencePhotos: newPhotos } });
      setPhotosModal({ isOpen: true, orderToEdit: { ...order, repair: { ...order.repair, evidencePhotos: newPhotos } } });
    } catch (error) {
      console.error('Error uploading photo to Supabase Storage:', error);
      // Si falla el upload a Storage, guardamos la imagen local (base64) como fallback
      const newPhotos = [...(order.repair.evidencePhotos || []), { stage, url: resizedBase64 }];
      await updateOrder(order.id, { repair: { ...order.repair, evidencePhotos: newPhotos } });
      setPhotosModal({ isOpen: true, orderToEdit: { ...order, repair: { ...order.repair, evidencePhotos: newPhotos } } });
    }
  };

  return {
    orders, filteredOrders, activeStatuses, toggleStatus, clearStatuses, search, setSearch,
    isPrintModalOpen, setIsPrintModalOpen, orderToPrint, setOrderToPrint,
    statusConfirmModal, setStatusConfirmModal,
    paymentMethod, setPaymentMethod,
    generateSalesNote, setGenerateSalesNote,
    billingCustomer, setBillingCustomer,
    isConfirming,
    successMessage,
    deleteConfirmModal, setDeleteConfirmModal,
    photosModal, setPhotosModal,
    editModal, setEditModal,
    getStatusLabel, getStatusColor,
    notifyWhatsApp, confirmStatusChange,
    processFileUpload,
    updateOrder, deleteOrder,
    confirmDelete: async () => {
      if (deleteConfirmModal) {
        await deleteOrder(deleteConfirmModal.orderId);
        setDeleteConfirmModal(null);
        showSuccess('✓ Orden eliminada de la base de datos.');
      }
    },
    confirmEditSave: async (updatedOrder: ServiceOrder) => {
      await updateOrder(updatedOrder.id, {
        customer: updatedOrder.customer,
        device:   updatedOrder.device,
        repair:   updatedOrder.repair,
      });
      showSuccess('✓ Cambios guardados en la base de datos.');
    },
    deletePhoto: async (order: ServiceOrder, photoIndex: number) => {
      const photo = order.repair.evidencePhotos?.[photoIndex];
      if (!photo) return;
      
      try {
        // Intentar eliminar de Supabase Storage
        await deletePhoto(photo.url);
      } catch (error) {
        console.warn('Could not delete from Storage (may be base64):', error);
      }
      
      // Actualizar el estado local sin la foto
      const newPhotos = order.repair.evidencePhotos.filter((_, i) => i !== photoIndex);
      await updateOrder(order.id, { repair: { ...order.repair, evidencePhotos: newPhotos } });
      setPhotosModal({ isOpen: true, orderToEdit: { ...order, repair: { ...order.repair, evidencePhotos: newPhotos } } });
    },
  };
};
