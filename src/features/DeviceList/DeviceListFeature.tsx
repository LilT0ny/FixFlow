import React from 'react';
import { Search, MessageCircle, Trash2, DollarSign } from 'lucide-react';
import { useDeviceList } from './hooks/useDeviceList';
import { BuscadorListado } from './components/molecules/BuscadorListado';
import { FiltroTabs } from './components/molecules/FiltroTabs';
import { CardOrden } from './components/organisms/CardOrden';
import { printReceipt } from '../../utils/printHelpers';

// Layout Feature para la lista de dispositivos
export const DeviceListFeature: React.FC = () => {
  const ctrl = useDeviceList();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">Gestión de Órdenes</h2>
          <p className="text-surface-500 mt-2 font-medium">Busca y administra todas las reparaciones.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 space-y-4">
        <BuscadorListado valor={ctrl.search} alCambiar={ctrl.setSearch} placeholder="Buscar por Nombre, Cédula o IMEI..." />
        <FiltroTabs filtroActual={ctrl.filter} alCambiar={ctrl.setFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ctrl.filteredOrders.map(order => (
          <CardOrden 
            key={order.id}
            order={order}
            getStatusLabel={ctrl.getStatusLabel}
            getStatusColor={ctrl.getStatusColor}
            onEdit={() => ctrl.setEditModal({ isOpen: true, order })}
            onDelete={() => ctrl.setDeleteConfirmModal({ isOpen: true, orderId: order.id })}
            onPhotos={() => ctrl.setPhotosModal({ isOpen: true, orderToEdit: order })}
            onStatusChange={(newStatus) => {
              if (newStatus === 'entregado') {
                ctrl.setBillingCustomer({ ...order.customer, address: '' });
              } else {
                ctrl.setBillingCustomer(null);
              }
              ctrl.setStatusConfirmModal({ isOpen: true, orderId: order.id, newStatus });
            }}
            onPrint={() => {
              ctrl.setOrderToPrint(order);
              ctrl.setIsPrintModalOpen(true);
            }}
            onNotaVenta={() => ctrl.setNotaVentaConfirmModal({ isOpen: true, order })}
            onNotify={() => ctrl.notifyWhatsApp(order, ctrl.getStatusLabel(order.status))}
          />
        ))}

        {ctrl.filteredOrders.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-surface-200 rounded-3xl p-12 text-center flex flex-col justify-center items-center">
             <div className="w-16 h-16 bg-surface-100 text-surface-400 rounded-full flex items-center justify-center mb-4">
               <Search className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-surface-900">No se encontraron resultados</h3>
             <p className="text-surface-500 mt-1">Intenta con otros términos u otros filtros.</p>
          </div>
        )}
      </div>

      {/* Modal Eliminación */}
      {ctrl.deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                 <Trash2 className="w-8 h-8 text-danger-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-center text-surface-900 mb-2">¿Eliminar Registro?</h3>
            <p className="text-sm text-center text-surface-500 mb-4">Esta acción no se puede deshacer de forma fácil.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => ctrl.setDeleteConfirmModal(null)} className="flex-1 border border-surface-300 rounded-xl font-bold py-3 hover:bg-surface-50">Cancelar</button>
              <button onClick={ctrl.confirmDelete} className="flex-1 bg-danger-600 text-white rounded-xl font-bold py-3 hover:bg-danger-700">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modales más grandes delegados a componentes en línea para evitar exceso de prop drilling en este refactor rápído, pero manejados por el controlador usando clean architecture */}
      
      {/* Modal Confirmación de Estado */}
      {ctrl.statusConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                   <MessageCircle className="w-8 h-8 text-primary-600" />
                 </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-center text-surface-900 mb-2">
                ¿Actualizar Estado?
              </h3>
              <p className="text-sm text-center text-surface-500 mb-6 font-medium">
                El dispositivo pasará a estar: <strong className="text-primary-600 bg-primary-50 px-2 py-1 rounded-md">{ctrl.getStatusLabel(ctrl.statusConfirmModal.newStatus)}</strong>
              </p>
              
              <div className="text-sm text-center text-surface-500 mb-6 italic">
                {ctrl.statusConfirmModal.newStatus !== 'entregado' && (
                  "Al confirmar, se abrirá WhatsApp automáticamente para notificar al cliente del cambio."
                )}
              </div>

              {ctrl.statusConfirmModal.newStatus === 'entregado' && (
                <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 mb-2 space-y-4">
                   <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-1">Monto Total de Reparación ($)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                         <input 
                           type="number" 
                           min="0"
                           step="0.01"
                           className="w-full pl-9 pr-3 py-2 border border-surface-300 bg-white rounded-xl focus:ring-primary-500 font-semibold"
                           value={ctrl.finalAmount}
                           onChange={(e) => ctrl.setFinalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                           placeholder="Ej. 45.00"
                         />
                      </div>
                   </div>

                   {typeof ctrl.finalAmount === 'number' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-surface-600">Abono previo:</span>
                        <span className="font-semibold text-surface-900">${ctrl.getPagado(ctrl.statusConfirmModal.orderId).toFixed(2)}</span>
                      </div>
                   )}

                   {typeof ctrl.finalAmount === 'number' && ctrl.finalAmount - ctrl.getPagado(ctrl.statusConfirmModal.orderId) > 0 && (
                     <>
                      <div className="flex justify-between items-center text-sm border-t border-surface-200 pt-3">
                        <span className="font-bold text-surface-900">Saldo Pendiente:</span>
                        <span className="font-bold text-primary-600 text-lg">${(ctrl.finalAmount - ctrl.getPagado(ctrl.statusConfirmModal.orderId)).toFixed(2)}</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-2 mt-2">Método de pago para el saldo</label>
                        <div className="grid grid-cols-2 gap-2">
                           <button 
                             onClick={() => ctrl.setPaymentMethod('efectivo')}
                             className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-colors ${ctrl.paymentMethod === 'efectivo' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-700 hover:bg-surface-50'}`}
                           >
                             Efectivo
                           </button>
                           <button 
                             onClick={() => ctrl.setPaymentMethod('transferencia')}
                             className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-colors ${ctrl.paymentMethod === 'transferencia' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-700 hover:bg-surface-50'}`}
                           >
                             Transferencia
                           </button>
                        </div>
                      </div>
                     </>
                   )}
                   {typeof ctrl.finalAmount === 'number' && ctrl.finalAmount - ctrl.getPagado(ctrl.statusConfirmModal.orderId) <= 0 && (
                     <div className="flex justify-center text-sm border-t border-surface-200 pt-3 text-success-600 font-bold">
                       Saldo completado
                     </div>
                   )}

                   {/* Datos de Facturación */}
                   {ctrl.billingCustomer && (
                     <div className="pt-4 border-t border-surface-200 mt-4 space-y-3">
                       <div className="flex justify-between items-center mb-2">
                         <h4 className="text-sm font-bold text-surface-900">Datos de Facturación</h4>
                         <button
                           onClick={() => {
                             const ord = ctrl.orders.find(o => o.id === ctrl.statusConfirmModal!.orderId);
                             ctrl.setBillingCustomer({ fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '9999999999', address: 'QUITO', email: ord?.customer?.email || '' });
                           }}
                           className="text-xs bg-surface-200 hover:bg-surface-300 text-surface-800 px-2 py-1 rounded-md font-semibold transition-colors"
                         >
                           Cons. Final
                         </button>
                       </div>
                       <div className="space-y-2">
                         <input 
                           type="text" 
                           className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white uppercase"
                           placeholder="Razón Social / Nombres"
                           value={ctrl.billingCustomer.fullName}
                           onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, fullName: e.target.value.toUpperCase() })}
                         />
                         <div className="grid grid-cols-2 gap-2">
                           <input 
                             type="text" 
                             className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white"
                             placeholder="CI / RUC"
                             value={ctrl.billingCustomer.documentId}
                             onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, documentId: e.target.value })}
                           />
                           <input 
                             type="text" 
                             className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white uppercase"
                             placeholder="Dirección"
                             value={ctrl.billingCustomer.address || ''}
                             onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, address: e.target.value.toUpperCase() })}
                           />
                         </div>
                         <input 
                           type="email" 
                           className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white"
                           placeholder="Email"
                           value={ctrl.billingCustomer.email || ''}
                           onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, email: e.target.value })}
                         />
                       </div>
                     </div>
                   )}
                </div>
              )}
            </div>
            
            <div className="p-6 pt-4 border-t border-surface-100 bg-white rounded-b-3xl shrink-0">
               <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     ctrl.setStatusConfirmModal(null);
                     ctrl.setFinalAmount('');
                     ctrl.setBillingCustomer(null);
                   }}
                  className="flex-1 bg-white border border-surface-300 text-surface-700 py-3 px-4 rounded-xl font-bold hover:bg-surface-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={ctrl.confirmStatusChange}
                  disabled={ctrl.statusConfirmModal.newStatus === 'entregado' && ctrl.finalAmount === ''}
                  className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Omítido momentáneamente en UI Limpia, asumiendo componente hijo pronto */}
      {ctrl.editModal?.isOpen && ctrl.editModal.order && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
             <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Editar Orden #{ctrl.editModal.order.orderNumber}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-surface-700">Falla Reportada</label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded-xl"
                      value={ctrl.editModal.order.repair.reportedIssue}
                      onChange={(e) => ctrl.setEditModal(p => p ? { ...p, order: { ...p.order, repair: { ...p.order.repair, reportedIssue: e.target.value.toUpperCase() } } } : null)}
                    />
                  </div>
                </div>
             </div>
             <div className="p-6 pt-4 border-t flex gap-3 mt-auto">
               <button onClick={() => ctrl.setEditModal(null)} className="flex-1 border rounded-xl font-bold py-3 hover:bg-surface-50">Cancelar</button>
               <button onClick={() => {
                 ctrl.updateOrder(ctrl.editModal!.order.id, ctrl.editModal!.order);
                 ctrl.setEditModal(null);
               }} className="flex-1 bg-primary-600 text-white rounded-xl font-bold py-3 hover:bg-primary-700">Guardar</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Configuración Impresión */}
      {ctrl.isPrintModalOpen && ctrl.orderToPrint && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-8 duration-300 relative p-6">
            <h3 className="text-xl font-bold mb-4">Imprimir Recibo #{ctrl.orderToPrint.orderNumber}</h3>
            <div className="space-y-3">
              <button onClick={() => { printReceipt(ctrl.orderToPrint!, '80mm', 'ticket'); ctrl.setIsPrintModalOpen(false); }} className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700">
                Ticket térmico
              </button>
              <button onClick={() => { ctrl.setIsPrintModalOpen(false); }} className="w-full border font-bold py-3 rounded-xl hover:bg-surface-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
