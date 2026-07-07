import React from 'react';
import { MessageCircle, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { useDeviceList } from './hooks/useDeviceList';
import { BuscadorListado } from './components/molecules/BuscadorListado';
import { FiltroTabs } from './components/molecules/FiltroTabs';
import { CardOrden } from './components/organisms/CardOrden';
import { PrintManager } from '../../components/organisms/PrintManager';
import { EditOrderModal } from './components/organisms/EditOrderModal';
import { EvidencePhotosModal } from './components/organisms/EvidencePhotosModal';
import { PageHeader, EmptyState } from '../../components/design-system';
import { Button } from '../../components/atoms/Button';

/** Layout Feature para la lista de dispositivos registrados */
export const DeviceListFeature: React.FC = () => {
  const ctrl = useDeviceList();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Dispositivos"
        subtitle="Monitoreo y gestión de equipos en taller"
      />

      <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-surface-200">
          <BuscadorListado valor={ctrl.search} alCambiar={ctrl.setSearch} placeholder="Buscar por nombre, cédula o identificador de equipo..." />
        </div>
        <div className="p-4 bg-surface-50">
          <FiltroTabs activeStatuses={ctrl.activeStatuses} toggleStatus={ctrl.toggleStatus} clearStatuses={ctrl.clearStatuses} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {ctrl.filteredOrders.map((order, idx) => (
          <div key={order.id} style={{ animationDelay: `${idx * 40}ms` }} className="animate-fade-in-up">
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
          <EmptyState
            title="Sin correspondencias encontradas"
            description="Probá ajustando los criterios de búsqueda o los filtros."
          />
        )}
      </div>

      {/* ─── Modal: Confirmar Eliminación ─── */}
      {ctrl.deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-surface-900/40 z-[100] flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-surface-200 shadow-lg w-full max-w-sm p-6 flex flex-col items-center animate-scale-in">
            <div className="w-12 h-12 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-center text-surface-900 mb-1">¿Eliminar registro?</h3>
            <p className="text-sm text-center text-surface-500 mb-6">
              Esta operación marcará la orden como eliminada. Esta acción es monitoreada.
            </p>
            <div className="flex flex-col w-full gap-2">
              <Button variant="danger" onClick={ctrl.confirmDelete} className="w-full">
                Confirmar eliminación
              </Button>
              <Button variant="ghost" onClick={() => ctrl.setDeleteConfirmModal(null)} className="w-full">
                Volver atrás
              </Button>
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
          <div className="fixed inset-0 bg-surface-900/40 z-[100] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl border border-surface-200 shadow-lg w-full max-w-md flex flex-col max-h-[90vh] animate-scale-in overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-6 gap-4">
                  <div className="w-11 h-11 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-surface-500 block mb-1">Nuevo estado</span>
                    <span className="text-xs font-medium bg-surface-900 text-white px-2.5 py-1 rounded-md">
                      {ctrl.getStatusLabel(newStatus)}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-surface-900 mb-1">Transición de estado</h3>
                <p className="text-sm text-surface-500 mb-6">
                  ¿Estás seguro de mover esta orden al estado <span className="text-surface-900 font-medium">{ctrl.getStatusLabel(newStatus)}</span>?
                  {newStatus !== 'entregado' && " Se enviará una notificación automática vía WhatsApp."}
                </p>

                {/* ─── Sub-Panel: ENTREGADO ─── */}
                {newStatus === 'entregado' && (
                  <div className="space-y-5">
                    <div className="bg-surface-900 text-white rounded-xl p-6">
                      <div className="space-y-4">
                        <div className="text-xs font-medium text-white/50 border-b border-white/10 pb-3">
                          Resumen económico final
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-xs text-white/50 mb-1">Costo total</span>
                            <span className="text-lg font-semibold tracking-tight">${total.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs text-white/50 mb-1">Abonado</span>
                            <span className="text-lg font-semibold tracking-tight text-emerald-400">-${abono.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                          <div>
                            <span className="block text-xs text-white/50 mb-1">Saldo a cobrar</span>
                            <span className="text-3xl font-semibold tracking-tight text-white">
                              ${saldo.toFixed(2)}
                            </span>
                          </div>
                          {saldo > 0 && (
                            <div className="bg-white/10 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-400">
                              Pendiente
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors duration-150 border ${ctrl.generateSalesNote ? 'bg-primary-50/50 border-primary-500' : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors duration-150 shrink-0 ${ctrl.generateSalesNote ? 'bg-primary-600 text-white' : 'bg-white border border-surface-300 text-transparent'}`}>
                          <CheckCircle className="w-3.5 h-3.5" />
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
                          <span className="text-sm font-medium text-surface-900 block">Generar nota de venta</span>
                          <span className="text-xs text-surface-500 mt-0.5 block">Documento tributario formal</span>
                        </div>
                      </label>

                      {ctrl.generateSalesNote && (
                        <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl space-y-3 animate-fade-in-up">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-surface-500">Detalle de facturación</span>
                            <button onClick={() => ctrl.setBillingCustomer({ fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '9999999999', address: 'QUITO', email: '' })} className="text-xs font-medium bg-surface-900 text-white px-2.5 py-1 rounded-md hover:bg-surface-800 transition-colors duration-150">CF +</button>
                          </div>
                          <input type="text" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Nombres / Razón social" value={ctrl.billingCustomer?.fullName || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, fullName: e.target.value.toUpperCase() })} />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Identificación" value={ctrl.billingCustomer?.documentId || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, documentId: e.target.value })} />
                            <input type="text" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Ciudad" value={ctrl.billingCustomer?.address || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, address: e.target.value.toUpperCase() })} />
                          </div>
                        </div>
                      )}

                      {saldo > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-surface-500">Método de liquidación</span>
                          <div className="grid grid-cols-2 gap-3">
                            {(['efectivo', 'transferencia'] as const).map(m => (
                              <button key={m} onClick={() => ctrl.setPaymentMethod(m)} className={`py-2.5 px-4 text-sm font-medium capitalize rounded-lg border transition-colors duration-150 ${ctrl.paymentMethod === m ? 'bg-surface-900 text-white border-surface-900' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'}`}>{m}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 bg-surface-50 border-t border-surface-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button onClick={() => { ctrl.setStatusConfirmModal(null); ctrl.setPaymentMethod('efectivo'); ctrl.setBillingCustomer(null); }} className="flex-1 py-2.5 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors duration-150 order-2 sm:order-1">Cancelar</button>
                <button onClick={ctrl.confirmStatusChange} disabled={ctrl.isConfirming} className="flex-[2] bg-surface-900 text-white h-11 rounded-lg text-sm font-medium hover:bg-surface-800 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-60">
                  {ctrl.isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirmar cambio</>}
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

      {/* ─── Toast de éxito ─── */}
      {ctrl.successMessage && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] animate-fade-in-up">
          <div className="bg-surface-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-full shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Operación exitosa</p>
              <p className="text-xs text-surface-300 mt-0.5 truncate">{ctrl.successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
