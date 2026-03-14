import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, Printer, MessageCircle, X, Smartphone, Clock, FileText, Wrench, CheckCircle, Trash2, DollarSign, Camera, Edit2 } from 'lucide-react';
import type { OrderStatus, ServiceOrder, CustomerData } from '../types';
import { printReceipt } from '../utils/printHelpers';

type FilterTab = 'all' | 'pendientes' | 'reparados' | 'entregados';

export const DeviceList = () => {
  const { orders, payments, updateOrderStatus, updateOrder, addPayment, deleteOrder } = useAppContext();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('58mm');
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);
  
  // Status Confirmation Modal State
  const [statusConfirmModal, setStatusConfirmModal] = useState<{ isOpen: boolean, orderId: string, newStatus: OrderStatus } | null>(null);
  
  // Delivered Modal specific fields
  const [finalAmount, setFinalAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [billingCustomer, setBillingCustomer] = useState<CustomerData | null>(null);

  // Nota de Venta Confirmation Modal State
  const [notaVentaConfirmModal, setNotaVentaConfirmModal] = useState<{ isOpen: boolean, order: ServiceOrder } | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean, orderId: string } | null>(null);

  // Photos View Modal
  const [photosModal, setPhotosModal] = useState<{ isOpen: boolean, orderToEdit: ServiceOrder | null } | null>(null);

  // Edit Order Modal State
  const [editModal, setEditModal] = useState<{ isOpen: boolean, order: ServiceOrder } | null>(null);

  const filteredOrders = orders.filter(o => {
    // Filter by Tab
    if (filter === 'pendientes' && !['recibido', 'diagnostico', 'esperando_repuestos'].includes(o.status)) return false;
    if (filter === 'reparados' && o.status !== 'listo') return false;
    if (filter === 'entregados' && o.status !== 'entregado') return false;

    // Filter by Search (Name, Cédula, IMEI, OrderNumber)
    if (search) {
      const q = search.toLowerCase();
      if (!o.customer.fullName.toLowerCase().includes(q) && 
          !o.customer.documentId.toLowerCase().includes(q) &&
          !o.device.serialNumber.toLowerCase().includes(q) &&
          !o.orderNumber.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

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
      case 'recibido': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'diagnostico': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'esperando_repuestos': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'listo': return 'bg-green-100 text-green-800 border-green-200';
      case 'entregado': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusList: OrderStatus[] = [
    'recibido', 'diagnostico', 'esperando_repuestos', 'listo', 'entregado'
  ];

  const handleWhatsApp = (order: ServiceOrder) => {
    let phoneNumber = order.customer.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '593' + phoneNumber.substring(1);
    }
    const message = `Hola ${order.customer.fullName}, te informamos que tu ${order.device.brand} ${order.device.model} se encuentra en estado: ${getStatusLabel(order.status)}.`;
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openPrintModal = (order: ServiceOrder) => {
    setOrderToPrint(order);
    setIsPrintModalOpen(true);
  };

  const handlePrint = (docType: 'ticket' | 'nota-venta' = 'ticket') => {
    if (orderToPrint) {
      printReceipt(orderToPrint, selectedFormat, docType);
    }
    setIsPrintModalOpen(false);
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
      const pagado = payments.filter(p => p.orderId === orderId && p.transactionType === 'ingreso').reduce((sum, p) => sum + p.amount, 0);
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
    
    // Automate WhatsApp notification
    const orderToNotify = orders.find(o => o.id === orderId);
    if (orderToNotify) {
        let phoneNumber = orderToNotify.customer.phone.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '593' + phoneNumber.substring(1);
        }
        const message = `Hola ${orderToNotify.customer.fullName}, te informamos que tu ${orderToNotify.device.brand} ${orderToNotify.device.model} se encuentra en estado: ${getStatusLabel(newStatus)}.`;
        const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
    
    setStatusConfirmModal(null);
    setFinalAmount('');
    setBillingCustomer(null);
  };

  const confirmDelete = () => {
    if (!deleteConfirmModal) return;
    deleteOrder(deleteConfirmModal.orderId);
    setDeleteConfirmModal(null);
  };

  const getPagado = (orderId: string) => {
    return payments.filter(p => p.orderId === orderId && p.transactionType === 'ingreso').reduce((sum, p) => sum + p.amount, 0);
  };

  const handleFileUpload = (order: ServiceOrder, stage: 'antes' | 'durante' | 'despues', e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const currentPhotos = order.repair.evidencePhotos || [];
    const stagePhotosCount = currentPhotos.filter(p => p.stage === stage).length;
    if (stagePhotosCount >= 3) return;
    
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        const img = new Image();
        img.src = base64String;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);

          const newPhotos = [...currentPhotos, { stage, url: resizedBase64 }];
          updateOrder(order.id, { repair: { ...order.repair, evidencePhotos: newPhotos } });
          setPhotosModal({ isOpen: true, orderToEdit: { ...order, repair: { ...order.repair, evidencePhotos: newPhotos } } });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (order: ServiceOrder, index: number) => {
    const currentPhotos = order.repair.evidencePhotos || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    updateOrder(order.id, { repair: { ...order.repair, evidencePhotos: newPhotos } });
    setPhotosModal({ isOpen: true, orderToEdit: { ...order, repair: { ...order.repair, evidencePhotos: newPhotos } } });
  };

  return (
    <div className="space-y-6">
      {/* Header and Add buttons could go here */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Gestión de Órdenes</h2>
          <p className="text-gray-500 mt-1">Busca y administra todas las reparaciones.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por Nombre, Cédula o IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-700 bg-gray-50 hover:bg-white uppercase"
          />
        </div>

        {/* Quick Filters (Badges) */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { id: 'all', label: 'Todos', icon: FileText },
            { id: 'pendientes', label: 'Pendientes', icon: Clock },
            { id: 'reparados', label: 'Reparados', icon: CheckCircle },
            { id: 'entregados', label: 'Entregados', icon: Smartphone }
          ].map((tab) => {
             const isSelected = filter === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setFilter(tab.id as FilterTab)}
                 className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                   isSelected 
                     ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                 }`}
               >
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
               </button>
             );
          })}
        </div>
      </div>

      {/* Repair Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  #{order.orderNumber}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <button 
                    onClick={() => setEditModal({ isOpen: true, order })}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Editar Registro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmModal({ isOpen: true, orderId: order.id })}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Eliminar Registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 leading-tight">{order.device.brand} {order.device.model}</h3>
                   <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                     <span>IMEI: {order.device.serialNumber || 'N/A'}</span>
                   </div>
                 </div>

                 <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                   <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 mb-1">
                     <Wrench className="w-4 h-4 text-gray-400" />
                     Falla Reportada
                   </p>
                   <p className="text-sm text-gray-600 line-clamp-2">{order.repair.reportedIssue}</p>
                 </div>

                 <div>
                    <h4 className="text-sm font-semibold text-gray-900">Cliente</h4>
                    <p className="text-sm text-gray-600">{order.customer.fullName} • C.I: {order.customer.documentId}</p>
                 </div>
                 
                 {order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0 ? (
                   <div className="pt-2">
                     <button
                       onClick={() => setPhotosModal({ isOpen: true, orderToEdit: order })}
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                     >
                       <Camera className="w-4 h-4" />
                       Gestionar Evidencias ({order.repair.evidencePhotos.length}/9)
                     </button>
                   </div>
                 ) : (
                    <div className="pt-2">
                     <button
                       onClick={() => setPhotosModal({ isOpen: true, orderToEdit: order })}
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors border border-gray-200"
                     >
                       <Camera className="w-4 h-4" />
                       Añadir Evidencias (0/9)
                     </button>
                   </div>
                 )}
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
              <div className="w-full">
                <label className="sr-only">Cambiar Estado</label>
                <select
                  value={order.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as OrderStatus;
                    if (newStatus === 'entregado') {
                      setBillingCustomer({ ...order.customer, address: '' });
                    } else {
                      setBillingCustomer(null);
                    }
                    setStatusConfirmModal({ isOpen: true, orderId: order.id, newStatus });
                  }}
                  title="Cambiar estado de la orden"
                  aria-label="Cambiar estado de la orden"
                  className="w-full text-sm font-semibold rounded-xl px-3 py-2 cursor-pointer outline-none border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                >
                  {statusList.map(opt => (
                    <option key={opt} value={opt}>{getStatusLabel(opt)}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => openPrintModal(order)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  title="Opciones de Impresión"
                >
                  <Printer className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
                {order.status === 'entregado' && (
                  <button 
                    onClick={() => {
                      setNotaVentaConfirmModal({ isOpen: true, order });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    title="Generar Nota de Venta"
                  >
                    <FileText className="w-4 h-4" /> 
                    <span className="hidden sm:inline">Nota Venta</span>
                  </button>
                )}
                <button 
                  onClick={() => handleWhatsApp(order)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#20BE5C] transition-colors shadow-sm"
                  title="Notificar por WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Notificar</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col justify-center items-center">
             <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
               <Search className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-gray-900">No se encontraron resultados</h3>
             <p className="text-gray-500 mt-1">Intenta con otros términos u otros filtros.</p>
          </div>
        )}
      </div>

      {/* Modal Configuración Impresión */}
      {isPrintModalOpen && orderToPrint && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-8 duration-300 relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
               <h3 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <Printer className="w-6 h-6 text-blue-600"/> 
                Imprimir Recibo
              </h3>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                title="Cerrar modal de impresión"
                aria-label="Cerrar modal de impresión"
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-6 font-medium">Orden #{orderToPrint.orderNumber}</p>
              
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Formato de Impresión</label>
                
                <div className="grid gap-3">
                  {[
                    { id: '58mm', label: 'Ticket Térmico (58mm)', desc: 'Impresora básica' },
                    { id: '80mm', label: 'Ticket Térmico (80mm)', desc: 'Impresora ancha' },
                    { id: 'A4', label: 'Hoja Normal (A4)', desc: 'Impresora estándar' }
                  ].map(format => (
                    <label 
                      key={format.id} 
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedFormat === format.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex h-5 items-center">
                        <input 
                          type="radio" 
                          name="print-format" 
                          value={format.id}
                          checked={selectedFormat === format.id}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-600" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className={`block text-sm font-bold ${selectedFormat === format.id ? 'text-blue-900' : 'text-gray-900'}`}>
                          {format.label}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">{format.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 space-y-2 shrink-0">
              <button 
                onClick={() => handlePrint('ticket')}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Imprimir Ticket
              </button>
              <button 
                onClick={() => handlePrint('nota-venta')}
                className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-black transition-colors active:scale-95 shadow-sm"
              >
                <FileText className="w-4 h-4" /> Generar Nota de Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Estado */}
      {statusConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                   <MessageCircle className="w-8 h-8 text-blue-600" />
                 </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-center text-gray-900 mb-2">
                ¿Actualizar Estado?
              </h3>
              <p className="text-sm text-center text-gray-500 mb-6 font-medium">
                El dispositivo pasará a estar: <strong className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{getStatusLabel(statusConfirmModal.newStatus)}</strong>
              </p>
              
              <div className="text-sm text-center text-gray-500 mb-6 italic">
                {statusConfirmModal.newStatus !== 'entregado' && (
                  "Al confirmar, se abrirá WhatsApp automáticamente para notificar al cliente del cambio."
                )}
              </div>

              {statusConfirmModal.newStatus === 'entregado' && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-2 space-y-4">
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Monto Total de Reparación ($)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input 
                           type="number" 
                           min="0"
                           step="0.01"
                           className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 font-semibold"
                           value={finalAmount}
                           onChange={(e) => setFinalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                           placeholder="Ej. 45.00"
                         />
                      </div>
                   </div>

                   {typeof finalAmount === 'number' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Abono previo:</span>
                        <span className="font-semibold text-gray-900">${getPagado(statusConfirmModal.orderId).toFixed(2)}</span>
                      </div>
                   )}

                   {typeof finalAmount === 'number' && finalAmount - getPagado(statusConfirmModal.orderId) > 0 && (
                     <>
                      <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                        <span className="font-bold text-gray-900">Saldo Pendiente:</span>
                        <span className="font-bold text-blue-600 text-lg">${(finalAmount - getPagado(statusConfirmModal.orderId)).toFixed(2)}</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 mt-2">Método de pago para el saldo</label>
                        <div className="grid grid-cols-2 gap-2">
                           <button 
                             onClick={() => setPaymentMethod('efectivo')}
                             className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-colors ${paymentMethod === 'efectivo' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                           >
                             Efectivo
                           </button>
                           <button 
                             onClick={() => setPaymentMethod('transferencia')}
                             className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-colors ${paymentMethod === 'transferencia' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                           >
                             Transferencia
                           </button>
                        </div>
                      </div>
                     </>
                   )}
                   {typeof finalAmount === 'number' && finalAmount - getPagado(statusConfirmModal.orderId) <= 0 && (
                     <div className="flex justify-center text-sm border-t border-gray-200 pt-3 text-green-600 font-bold">
                       Saldo completado
                     </div>
                   )}

                   {/* Datos de Facturación */}
                   {billingCustomer && (
                     <div className="pt-4 border-t border-gray-200 mt-4 space-y-3">
                       <div className="flex justify-between items-center mb-2">
                         <h4 className="text-sm font-bold text-gray-900">Datos de Facturación</h4>
                         <button
                           onClick={() => {
                             const ord = orders.find(o => o.id === statusConfirmModal.orderId);
                             setBillingCustomer({ fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '9999999999', address: 'QUITO', email: ord?.customer?.email || '' });
                           }}
                           className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded-md font-semibold transition-colors"
                         >
                           Cons. Final
                         </button>
                       </div>
                       <div className="space-y-2">
                         <input 
                           type="text" 
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white uppercase"
                           placeholder="Razón Social / Nombres"
                           value={billingCustomer.fullName}
                           onChange={e => setBillingCustomer({ ...billingCustomer, fullName: e.target.value.toUpperCase() })}
                         />
                         <div className="grid grid-cols-2 gap-2">
                           <input 
                             type="text" 
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                             placeholder="CI / RUC"
                             value={billingCustomer.documentId}
                             onChange={e => setBillingCustomer({ ...billingCustomer, documentId: e.target.value })}
                           />
                           <input 
                             type="text" 
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white uppercase"
                             placeholder="Dirección"
                             value={billingCustomer.address || ''}
                             onChange={e => setBillingCustomer({ ...billingCustomer, address: e.target.value.toUpperCase() })}
                           />
                         </div>
                         <input 
                           type="email" 
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                           placeholder="Email"
                           value={billingCustomer.email || ''}
                           onChange={e => setBillingCustomer({ ...billingCustomer, email: e.target.value })}
                         />
                       </div>
                     </div>
                   )}
                </div>
              )}
            </div>
            
            <div className="p-6 pt-4 border-t border-gray-100 bg-white rounded-b-3xl shrink-0">
              <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     setStatusConfirmModal(null);
                     setFinalAmount('');
                     setBillingCustomer(null);
                   }}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmStatusChange}
                  disabled={statusConfirmModal.newStatus === 'entregado' && finalAmount === ''}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminación Lógica */}
      {deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                 <Trash2 className="w-8 h-8 text-red-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-center text-gray-900 mb-2">
              ¿Eliminar Registro?
            </h3>
            <p className="text-sm text-center text-gray-500 mb-4">
              Esta acción moverá el registro a la papelera oculta. ¿Estás seguro de continuar?
            </p>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-700">Orden:</span>
                <span className="font-bold text-red-900 text-right">#{orders.find(o => o.id === deleteConfirmModal.orderId)?.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Cliente:</span>
                <span className="font-bold text-red-900 text-right">{orders.find(o => o.id === deleteConfirmModal.orderId)?.customer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Equipo:</span>
                <span className="font-bold text-red-900 text-right">{orders.find(o => o.id === deleteConfirmModal.orderId)?.device.brand} {orders.find(o => o.id === deleteConfirmModal.orderId)?.device.model}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver y Gestionar Fotos */}
      {photosModal?.isOpen && photosModal.orderToEdit && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
               <div>
                 <h3 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                   <Camera className="w-6 h-6 text-blue-600" />
                   Evidencias del Equipo
                 </h3>
                 <p className="text-sm text-gray-500 mt-1">Orden #{photosModal.orderToEdit.orderNumber} - {photosModal.orderToEdit.device.model}</p>
               </div>
               <button 
                 onClick={() => setPhotosModal(null)}
                 title="Cerrar modal de evidencias"
                 aria-label="Cerrar modal de evidencias"
                 className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {(photosModal.orderToEdit.repair.evidencePhotos || []).map((photo, i) => (
                   <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video">
                     <a href={photo.url} target="_blank" rel="noreferrer" className="block w-full h-full cursor-pointer">
                       <img src={photo.url} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                     </a>
                     <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md uppercase font-bold tracking-wider">
                       {photo.stage}
                     </div>
                     <button
                        type="button"
                        onClick={() => removePhoto(photosModal.orderToEdit!, i)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar foto"
                     >
                        <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 ))}

                 {(!photosModal.orderToEdit.repair.evidencePhotos || photosModal.orderToEdit.repair.evidencePhotos.length < 9) && (
                   <div className="aspect-video flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl overflow-hidden hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50">
                     <div className="space-y-2 text-center flex flex-col items-center justify-center w-full h-full p-2">
                       <Camera className="mx-auto h-6 w-6 text-gray-400" />
                       <p className="text-xs font-semibold text-gray-600">Añadir Nueva</p>
                       <div className="flex flex-col gap-1.5 w-full mt-2 overflow-y-auto max-h-24 no-scrollbar">
                          {((photosModal.orderToEdit.repair.evidencePhotos || []).filter(p => p.stage === 'antes').length < 3) && (
                            <label className="relative cursor-pointer rounded-lg px-2 py-1.5 bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 w-full text-center">
                              <span>Subir "Antes"</span>
                              <input type="file" className="sr-only" onChange={(e) => handleFileUpload(photosModal.orderToEdit!, 'antes', e)} accept="image/*" />
                            </label>
                          )}
                          {((photosModal.orderToEdit.repair.evidencePhotos || []).filter(p => p.stage === 'durante').length < 3) && (
                            <label className="relative cursor-pointer rounded-lg px-2 py-1.5 bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 w-full text-center">
                              <span>Subir "Durante"</span>
                              <input type="file" className="sr-only" onChange={(e) => handleFileUpload(photosModal.orderToEdit!, 'durante', e)} accept="image/*" />
                            </label>
                          )}
                          {((photosModal.orderToEdit.repair.evidencePhotos || []).filter(p => p.stage === 'despues').length < 3) && (
                            <label className="relative cursor-pointer rounded-lg px-2 py-1.5 bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 w-full text-center">
                              <span>Subir "Final"</span>
                              <input type="file" className="sr-only" onChange={(e) => handleFileUpload(photosModal.orderToEdit!, 'despues', e)} accept="image/*" />
                            </label>
                          )}
                       </div>
                       <p className="text-[10px] text-gray-500 pt-1">Máx. 3 x etapa</p>
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
               <button 
                 onClick={() => setPhotosModal(null)}
                 className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-colors"
               >
                 Aceptar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Nota de Venta */}
      {notaVentaConfirmModal?.isOpen && notaVentaConfirmModal.order && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                 <FileText className="w-8 h-8 text-blue-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-center text-gray-900 mb-2">
              Verificando Facturación
            </h3>
            <p className="text-sm text-center text-gray-500 mb-4">
              Revisa los datos fiscales antes de generar el comprobante legal de la orden #{notaVentaConfirmModal.order.orderNumber}.
            </p>
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Razón Social:</span>
                <span className="font-bold text-gray-900 text-right">{notaVentaConfirmModal.order.billingCustomer?.fullName || notaVentaConfirmModal.order.customer.fullName || 'CONSUMIDOR FINAL'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RUC/CI:</span>
                <span className="font-bold text-gray-900 text-right">{notaVentaConfirmModal.order.billingCustomer?.documentId || notaVentaConfirmModal.order.customer.documentId || '9999999999999'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total a Facturar:</span>
                <span className="font-bold text-blue-600 text-right">${(Number(notaVentaConfirmModal.order.repair.repairTotalCost) || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <label className="block text-sm font-semibold text-gray-700">Formato de Impresión</label>
              <div className="grid gap-3">
                {[
                  { id: '58mm', label: 'Ticket Térmico (58mm)' },
                  { id: '80mm', label: 'Ticket Térmico (80mm)' },
                  { id: 'A4', label: 'Hoja Normal (A4)' }
                ].map(format => (
                  <label 
                    key={format.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFormat === format.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="nota-format" 
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-600" 
                    />
                    <span className={`block text-sm font-bold ${selectedFormat === format.id ? 'text-blue-900' : 'text-gray-900'}`}>
                      {format.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setNotaVentaConfirmModal(null)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Revisar
              </button>
              <button 
                onClick={() => {
                  setOrderToPrint(notaVentaConfirmModal.order);
                  // Not hardcoding A4 anymore, we respect selectedFormat
                  setNotaVentaConfirmModal(null);
                  setTimeout(() => handlePrint('nota-venta'), 50);
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Generar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Order Modal */}
      {editModal?.isOpen && editModal.order && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                   <Edit2 className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">
                   Editar Orden #{editModal.order.orderNumber}
                 </h3>
              </div>
              
              {/* Cliente */}
              <div className="space-y-3">
                 <h4 className="font-semibold text-gray-900 border-b pb-2">Datos del Cliente</h4>
                 <div>
                   <label className="block text-xs text-gray-500 mb-1">Nombre Completo</label>
                   <input type="text" title="Nombre completo del cliente" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.customer.fullName} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, customer: { ...editModal.order.customer, fullName: e.target.value.toUpperCase() } } })} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Cédula/RUC</label>
                     <input type="text" title="Cédula o RUC del cliente" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.customer.documentId} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, customer: { ...editModal.order.customer, documentId: e.target.value.toUpperCase() } } })} />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                     <input type="text" title="Teléfono del cliente" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.customer.phone} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, customer: { ...editModal.order.customer, phone: e.target.value.toUpperCase() } } })} />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 mb-1">Correo Electrónico</label>
                   <input type="email" title="Correo electrónico del cliente" className="w-full px-3 py-2 border rounded-xl text-sm" value={editModal.order.customer.email || ''} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, customer: { ...editModal.order.customer, email: e.target.value } } })} />
                 </div>
              </div>

              {/* Equipo & Falla */}
              <div className="space-y-3 pt-4 border-t">
                 <h4 className="font-semibold text-gray-900 border-b pb-2">Datos del Equipo</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Marca</label>
                     <input type="text" title="Marca del equipo" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.device.brand} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, device: { ...editModal.order.device, brand: e.target.value.toUpperCase() } } })} />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Modelo</label>
                     <input type="text" title="Modelo del equipo" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.device.model} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, device: { ...editModal.order.device, model: e.target.value.toUpperCase() } } })} />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 mb-1">IMEI/SN</label>
                   <input type="text" title="IMEI o serial del equipo" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.device.serialNumber || ''} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, device: { ...editModal.order.device, serialNumber: e.target.value.toUpperCase() } } })} />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-500 mb-1">Problema Reportado</label>
                   <textarea title="Problema reportado del equipo" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" rows={2} value={editModal.order.repair.reportedIssue} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, repair: { ...editModal.order.repair, reportedIssue: e.target.value.toUpperCase() } } })} />
                 </div>
              </div>

              {/* Finanzas */}
              <div className="space-y-3 pt-4 border-t">
                 <h4 className="font-semibold text-gray-900 border-b pb-2">Costos</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Costo Total ($)</label>
                     <input type="number" step="0.01" title="Costo total de reparación" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.repair.repairTotalCost || ''} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, repair: { ...editModal.order.repair, repairTotalCost: parseFloat(e.target.value) || 0 } } })} />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Abono Inicial ($)</label>
                     <input type="number" step="0.01" title="Abono inicial" className="w-full px-3 py-2 border rounded-xl text-sm uppercase" value={editModal.order.repair.initialDeposit || ''} onChange={e => setEditModal({ ...editModal, order: { ...editModal.order, repair: { ...editModal.order.repair, initialDeposit: parseFloat(e.target.value) || 0 } } })} />
                   </div>
                 </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 bg-white rounded-b-3xl shrink-0">
               <div className="flex gap-3">
                 <button 
                   onClick={() => setEditModal(null)}
                   className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={() => {
                     updateOrder(editModal.order.id, editModal.order);
                     setEditModal(null);
                   }}
                   className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                 >
                   Guardar Cambios
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
