import React from 'react';
import { Search, MessageCircle, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { useDeviceList } from './hooks/useDeviceList';
import { BuscadorListado } from './components/molecules/BuscadorListado';
import { FiltroTabs } from './components/molecules/FiltroTabs';
import { CardOrden } from './components/organisms/CardOrden';
import { PrintManager } from '../../components/organisms/PrintManager';
import { EditOrderModal } from './components/organisms/EditOrderModal';
import { EvidencePhotosModal } from './components/organisms/EvidencePhotosModal';

/** Layout Feature para la lista de dispositivos registrados */
export const DeviceListFeature: React.FC = () => {
  const ctrl = useDeviceList();

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-surface-900 leading-tight">
            Bitácora de Reparaciones
          </h2>
          <p className="text-[10px] md:text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80 leading-relaxed">
            Monitoreo y Gestión de Dispositivos en Taller
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-surface-100/50 shadow-2xl shadow-surface-200/30 overflow-hidden mb-8 transition-all hover:shadow-primary-100/20">
        <div className="p-6 border-b border-surface-50 bg-surface-50/30 backdrop-blur-md">
          <BuscadorListado valor={ctrl.search} alCambiar={ctrl.setSearch} placeholder="Buscar por Nombre, Cédula o Identificador de Equipo..." />
        </div>
        <div className="p-5 bg-surface-50/30 backdrop-blur-sm">
          <FiltroTabs activeStatuses={ctrl.activeStatuses} toggleStatus={ctrl.toggleStatus} clearStatuses={ctrl.clearStatuses} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {ctrl.filteredOrders.map((order, idx) => (
          <div key={order.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardOrden
              order={order}
              getStatusLabel={ctrl.getStatusLabel}
              getStatusColor={ctrl.getStatusColor}
              onEdit={() => ctrl.setEditModal({ isOpen: true, order })}
              onDelete={() => ctrl.setDeleteConfirmModal({ isOpen: true, orderId: order.id })}
              onPhotos={() => ctrl.setPhotosModal({ isOpen: true, orderToEdit: order })}
              onStatusChange={(newStatus) => {
                if (newStatus === 'entregado') {
                  ctrl.setBillingCustomer({ ...order.customer, address: order.customer.address || '' });
                } else {
                  ctrl.setBillingCustomer(null);
                }
                ctrl.setStatusConfirmModal({ isOpen: true, orderId: order.id, newStatus });
              }}
              onPrint={() => {
                ctrl.setOrderToPrint(order);
                ctrl.setIsPrintModalOpen(true);
              }}
              onNotify={() => ctrl.notifyWhatsApp(order, ctrl.getStatusLabel(order.status))}
            />
          </div>
        ))}

        {ctrl.filteredOrders.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-surface-200 rounded-[40px] py-24 text-center flex flex-col justify-center items-center bg-white/50 backdrop-blur-sm animate-zoom-in">
            <div className="w-24 h-24 bg-surface-100 text-surface-400 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <Search className="w-10 h-10 opacity-30" />
            </div>
            <h3 className="text-xl font-black text-surface-900 tracking-tight">Sin correspondencias encontradas</h3>
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-2">Prueba ajustando los criterios de búsqueda o filtros</p>
          </div>
        )}
      </div>

      {/* ─── Modal: Confirmar Eliminación ─── */}
      {ctrl.deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-md z-[100] flex justify-center items-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-sm p-10 flex flex-col items-center animate-zoom-in">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-center text-surface-900 mb-3">¿Eliminar Registro?</h3>
            <p className="text-xs font-medium text-center text-surface-500 mb-10 leading-relaxed uppercase tracking-wide">
              Esta operación marcará la orden como eliminada. Esta acción es monitoreada.
            </p>
            <div className="flex flex-col w-full gap-3">
               <button
                onClick={ctrl.confirmDelete}
                className="w-full bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest py-5 px-6 hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
              >
                Confirmar Eliminación
              </button>
              <button
                onClick={() => ctrl.setDeleteConfirmModal(null)}
                className="w-full bg-surface-50 text-surface-500 rounded-2xl font-black text-[11px] uppercase tracking-widest py-5 px-6 hover:bg-surface-100 transition-all active:scale-95"
              >
                Volver Atrás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Confirmación de Cambio de Estado ─── */}
      {ctrl.statusConfirmModal?.isOpen && (() => {
        const orderId   = ctrl.statusConfirmModal.orderId;
        const newStatus = ctrl.statusConfirmModal.newStatus;
        const order     = ctrl.orders.find(o => o.id === orderId);

        const total = Number(order?.repair?.repairTotalCost) || 0;
        const abono = Number(order?.repair?.initialDeposit)  || 0;
        const saldo = Math.max(0, total - abono);

        return (
          <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-md z-[100] flex justify-center items-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md flex flex-col max-h-[90vh] animate-zoom-in overflow-hidden border border-white/20">
              <div className="p-6 md:p-10 pb-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-8 gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">Nuevo Estado</span>
                    <span className="text-xs font-black bg-primary-600 text-white px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-primary-200">
                      {ctrl.getStatusLabel(newStatus)}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-surface-900 mb-2">Transición de Estado</h3>
                <p className="text-xs font-medium text-surface-500 mb-8 leading-relaxed">
                  ¿Estás seguro de mover esta orden al estado <span className="text-primary-600 font-black">{ctrl.getStatusLabel(newStatus)}</span>? 
                  {newStatus !== 'entregado' && " Se enviará una notificación automática vía WhatsApp."}
                </p>

                {/* ─── Sub-Panel: ENTREGADO REFINADO ─── */}
                {newStatus === 'entregado' && (
                  <div className="space-y-6">
                    <div className="bg-surface-900 text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10 pb-3">
                            Resumen Económico Final
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <span className="block text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Costo Total</span>
                               <span className="text-xl font-black tracking-tighter">${total.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                               <span className="block text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Abonado</span>
                               <span className="text-xl font-black tracking-tighter text-emerald-400">-${abono.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                             <div>
                               <span className="block text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Saldo a Cobrar</span>
                               <span className="text-4xl font-black tracking-tighter text-white">
                                 ${saldo.toFixed(2)}
                               </span>
                             </div>
                             {saldo > 0 && (
                               <div className="bg-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-white/10">
                                 Pendiente
                               </div>
                             )}
                          </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                       <label className={`flex items-center gap-4 p-5 rounded-[24px] cursor-pointer transition-all border-2 ${ctrl.generateSalesNote ? 'bg-primary-50/50 border-primary-500 shadow-xl shadow-primary-500/10' : 'bg-surface-50 border-surface-100 hover:border-surface-200'}`}>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${ctrl.generateSalesNote ? 'bg-primary-600 text-white scale-110' : 'bg-white border border-surface-300 text-transparent'}`}>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={ctrl.generateSalesNote}
                            onChange={e => {
                                ctrl.setGenerateSalesNote(e.target.checked);
                                if (e.target.checked && !ctrl.billingCustomer) {
                                  const ord = ctrl.orders.find(o => o.id === ctrl.statusConfirmModal?.orderId);
                                  if (ord) ctrl.setBillingCustomer({ ...ord.customer, address: ord.customer.address || 'QUITO' });
                                }
                            }}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-black text-surface-900 block tracking-tight">Generar Nota de Venta</span>
                            <span className="text-[10px] text-surface-400 uppercase font-black tracking-widest mt-0.5 opacity-70 italic">Documento tributario formal</span>
                          </div>
                       </label>

                       {ctrl.generateSalesNote && (
                        <div className="p-6 bg-surface-50 border border-surface-100 rounded-[32px] space-y-4 animate-in slide-in-from-top-4 duration-500">
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Detalle de Facturación</span>
                              <button onClick={() => ctrl.setBillingCustomer({ fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '9999999999', address: 'QUITO', email: '' })} className="text-[9px] font-black bg-primary-600 text-white px-3 py-1.5 rounded-xl shadow-md uppercase tracking-tighter">CF +</button>
                           </div>
                           <input type="text" className="w-full bg-white border border-surface-100 px-4 py-3 rounded-2xl text-xs font-black uppercase text-surface-900 focus:ring-2 focus:ring-primary-500/30 transition-all" placeholder="NOMBRES / RAZÓN SOCIAL" value={ctrl.billingCustomer?.fullName || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, fullName: e.target.value.toUpperCase() })} />
                           <div className="grid grid-cols-2 gap-3">
                              <input type="text" className="w-full bg-white border border-surface-100 px-4 py-3 rounded-2xl text-xs font-black text-surface-900" placeholder="IDENTIFICACIÓN" value={ctrl.billingCustomer?.documentId || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, documentId: e.target.value })} />
                              <input type="text" className="w-full bg-white border border-surface-100 px-4 py-3 rounded-2xl text-xs font-black uppercase text-surface-900" placeholder="CIUDAD" value={ctrl.billingCustomer?.address || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, address: e.target.value.toUpperCase() })} />
                           </div>
                        </div>
                       )}

                       {saldo > 0 && (
                          <div className="space-y-3">
                             <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Método de Liquidación</span>
                             <div className="grid grid-cols-2 gap-3">
                                {(['efectivo', 'transferencia'] as const).map(m => (
                                  <button key={m} onClick={() => ctrl.setPaymentMethod(m)} className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border-2 transition-all ${ctrl.paymentMethod === m ? 'bg-primary-600 text-white border-primary-600 shadow-xl shadow-primary-200' : 'bg-white text-surface-400 border-surface-100 hover:border-surface-200'}`}>{m}</button>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 pt-4 bg-surface-50/50 backdrop-blur-md border-t border-surface-100 flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button onClick={() => { ctrl.setStatusConfirmModal(null); ctrl.setPaymentMethod('efectivo'); ctrl.setBillingCustomer(null); }} className="flex-1 py-4 font-black text-[10px] md:text-[11px] uppercase tracking-widest text-surface-400 hover:text-surface-600 transition-colors order-2 sm:order-1">Cancelar</button>
                  <button onClick={ctrl.confirmStatusChange} disabled={ctrl.isConfirming} className="flex-[2] bg-primary-600 text-white py-4 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2 order-1 sm:order-2">
                    {ctrl.isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirmar Cambio</>}
                  </button>
              </div>
            </div>
          </div>
        );
      })()}

      <EditOrderModal
        isOpen={!!(ctrl.editModal?.isOpen && ctrl.editModal.order)}
        order={ctrl.editModal?.order ?? null}
        onClose={() => ctrl.setEditModal(null)}
        onSave={ctrl.confirmEditSave}
      />

      {ctrl.photosModal?.isOpen && ctrl.photosModal.orderToEdit && (
        <EvidencePhotosModal
          isOpen={ctrl.photosModal.isOpen}
          orderNumber={ctrl.photosModal.orderToEdit.orderNumber}
          photos={ctrl.photosModal.orderToEdit.repair.evidencePhotos || []}
          onClose={() => ctrl.setPhotosModal(null)}
          onUpload={(stage, file) => ctrl.processFileUpload(ctrl.photosModal!.orderToEdit!, stage, file)}
          onDelete={(photoIndex) => ctrl.deletePhoto(ctrl.photosModal!.orderToEdit!, photoIndex)}
        />
      )}

      <PrintManager
        isOpen={ctrl.isPrintModalOpen}
        order={ctrl.orderToPrint}
        onClose={() => ctrl.setIsPrintModalOpen(false)}
      />

      {/* ─── TOAST DE ÉXITO PREMIUM ─── */}
      {ctrl.successMessage && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Operación Exitosa</p>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mt-1">{ctrl.successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
