import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, Printer, MessageCircle, X, Smartphone, Clock, FileText, Wrench, CheckCircle, Trash2, DollarSign, Camera } from 'lucide-react';
import type { OrderStatus, ServiceOrder } from '../types';
import { printReceipt } from '../utils/printHelpers';

type FilterTab = 'all' | 'pendientes' | 'reparados' | 'entregados';

export const DeviceList = () => {
  const { orders, payments, updateOrderStatus, addPayment, deleteOrder } = useAppContext();
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

  // Delete Confirmation Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean, orderId: string } | null>(null);

  // Photos View Modal
  const [photosModal, setPhotosModal] = useState<{ isOpen: boolean, photos: string[] } | null>(null);

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

  const handlePrint = () => {
    if (orderToPrint) {
      printReceipt(orderToPrint, selectedFormat);
    }
    setIsPrintModalOpen(false);
  };

  const confirmStatusChange = () => {
    if (!statusConfirmModal) return;
    const { orderId, newStatus } = statusConfirmModal;
    
    updateOrderStatus(orderId, newStatus);

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
  };

  const confirmDelete = () => {
    if (!deleteConfirmModal) return;
    deleteOrder(deleteConfirmModal.orderId);
    setDeleteConfirmModal(null);
  };

  const getPagado = (orderId: string) => {
    return payments.filter(p => p.orderId === orderId && p.transactionType === 'ingreso').reduce((sum, p) => sum + p.amount, 0);
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
                 
                 {order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0 && (
                   <div className="pt-2">
                     <button
                       onClick={() => setPhotosModal({ isOpen: true, photos: order.repair.evidencePhotos })}
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                     >
                       <Camera className="w-4 h-4" />
                       Ver Evidencias ({order.repair.evidencePhotos.length})
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
                  onChange={(e) => setStatusConfirmModal({ isOpen: true, orderId: order.id, newStatus: e.target.value as OrderStatus })}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-8 duration-300 relative">
            <button 
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1 flex items-center gap-2">
              <Printer className="w-6 h-6 text-blue-600"/> 
              Imprimir Recibo
            </h3>
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

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button 
                  onClick={handlePrint}
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Enviar a Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Estado */}
      {statusConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                 <MessageCircle className="w-8 h-8 text-blue-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-center text-gray-900 mb-2">
              ¿Actualizar Estado?
            </h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              El dispositivo pasará a estar: <strong className="text-gray-900">{getStatusLabel(statusConfirmModal.newStatus)}</strong>.<br/><br/>
              {statusConfirmModal.newStatus !== 'entregado' && (
                "Al confirmar, se abrirá WhatsApp automáticamente para notificar al cliente del cambio."
              )}
            </p>

            {statusConfirmModal.newStatus === 'entregado' && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 space-y-4">
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
                      <span className="font-bold text-gray-900">Saldo Pendiente a Cobrar:</span>
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
              </div>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setStatusConfirmModal(null);
                  setFinalAmount('');
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
            <p className="text-sm text-center text-gray-500 mb-6">
              Esta acción moverá el registro a la papelera oculta. ¿Estás seguro de continuar?
            </p>
            
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

      {/* Modal Ver Fotos */}
      {photosModal?.isOpen && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                 <Camera className="w-6 h-6 text-blue-600" />
                 Evidencias del Equipo
               </h3>
               <button 
                 onClick={() => setPhotosModal(null)}
                 className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
               {photosModal.photos.map((photo, i) => (
                 <a key={i} href={photo} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border border-gray-200">
                   <img src={photo} alt={`Evidencia ${i + 1}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"></div>
                 </a>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
