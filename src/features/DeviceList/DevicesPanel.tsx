import React from 'react';
import { MessageCircle, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { useDeviceList } from './hooks/useDeviceList';
import { BuscadorListado } from './components/molecules/BuscadorListado';
import { FiltroTabs } from './components/molecules/FiltroTabs';
import { TablaOrdenes } from './components/organisms/TablaOrdenes';
import { PrintManager } from '../../components/organisms/PrintManager';
import { EditOrderModal } from './components/organisms/EditOrderModal';
import { EvidencePhotosModal } from './components/organisms/EvidencePhotosModal';
import { Button } from '../../components/atoms/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';
import { useClienteLookup } from '../../hooks/useClienteLookup';

/** Panel de dispositivos en taller: buscador, filtros, tabla y modales.
 *  Se embebe en el Dashboard bajo los KPI. */
export const DevicesPanel: React.FC = () => {
  const ctrl = useDeviceList();
  const { lookup: lookupBillingClient, isSearching: isSearchingBillingClient } = useClienteLookup();

  const lookupAndFillBillingCustomer = async (cedula: string) => {
    const client = await lookupBillingClient(cedula);
    if (!client) return;
    ctrl.setBillingCustomer(prev => ({
      fullName: client.fullName.toUpperCase(),
      documentId: cedula,
      phone: client.phone || prev?.phone || '',
      email: client.email || prev?.email || '',
      address: client.address ? client.address.toUpperCase() : (prev?.address || ''),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-surface-200 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="w-full lg:w-[300px] lg:shrink-0">
            <BuscadorListado valor={ctrl.search} alCambiar={ctrl.setSearch} placeholder="Buscar cliente, cédula o equipo..." />
          </div>
          <div className="hidden lg:block w-px self-stretch bg-surface-200" />
          <div className="flex-1 min-w-0">
            <FiltroTabs activeStatuses={ctrl.activeStatuses} toggleStatus={ctrl.toggleStatus} clearStatuses={ctrl.clearStatuses} />
          </div>
        </div>
      </div>

      <TablaOrdenes
        orders={ctrl.filteredOrders}
        getStatusLabel={ctrl.getStatusLabel}
        getStatusColor={ctrl.getStatusColor}
        onEdit={(order) => ctrl.setEditModal({ isOpen: true, order })}
        onDelete={(order) => ctrl.setDeleteConfirmModal({ isOpen: true, orderId: order.id })}
        onPhotos={(order) => ctrl.setPhotosModal({ isOpen: true, orderToEdit: order })}
        onStatusChange={(order, newStatus) => {
          if (newStatus === 'entregado') {
            ctrl.setBillingCustomer({ ...order.customer, address: order.customer.address || '' });
          } else {
            ctrl.setBillingCustomer(null);
          }
          ctrl.setStatusConfirmModal({ isOpen: true, orderId: order.id, newStatus });
        }}
        onPrint={(order) => {
          ctrl.setOrderToPrint(order);
          ctrl.setIsPrintModalOpen(true);
        }}
        onNotify={(order) => ctrl.notifyWhatsApp(order, ctrl.getStatusLabel(order.status))}
      />

      {/* ─── Modal: Confirmar Eliminación ─── */}
      <Modal isOpen={!!ctrl.deleteConfirmModal?.isOpen} onClose={() => ctrl.setDeleteConfirmModal(null)} size="sm">
        <ModalBody className="flex flex-col items-center text-center pt-6">
          <div className="w-12 h-12 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-1">¿Eliminar registro?</h3>
          <p className="text-sm text-surface-500">
            Esta operación marcará la orden como eliminada. Esta acción es monitoreada.
          </p>
        </ModalBody>
        <ModalFooter className="flex-col">
          <Button variant="danger" onClick={ctrl.confirmDelete} className="w-full">
            Confirmar eliminación
          </Button>
          <Button variant="ghost" onClick={() => ctrl.setDeleteConfirmModal(null)} className="w-full">
            Volver atrás
          </Button>
        </ModalFooter>
      </Modal>

      {/* ─── Modal: Confirmación de Cambio de Estado ─── */}
      {ctrl.statusConfirmModal && (() => {
        const orderId   = ctrl.statusConfirmModal.orderId;
        const newStatus = ctrl.statusConfirmModal.newStatus;
        const order     = ctrl.orders.find(o => o.id === orderId);

        const total = Number(order?.repair?.repairTotalCost) || 0;
        const abono = Number(order?.repair?.initialDeposit)  || 0;
        const saldo = Math.max(0, total - abono);

        const closeModal = () => { ctrl.setStatusConfirmModal(null); ctrl.setPaymentMethod('efectivo'); ctrl.setBillingCustomer(null); };

        return (
          <Modal isOpen={ctrl.statusConfirmModal.isOpen} onClose={closeModal} size="md">
            <ModalHeader
              title="Transición de estado"
              icon={<MessageCircle className="w-5 h-5" />}
              iconClassName="bg-primary-50 text-primary-600"
              onClose={closeModal}
              closeDisabled={ctrl.isConfirming}
            />

            <ModalBody>
              <div className="flex justify-end mb-4">
                <span className="text-xs font-medium bg-surface-900 text-white px-2.5 py-1 rounded-md">
                  Nuevo estado: {ctrl.getStatusLabel(newStatus)}
                </span>
              </div>

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
                          <button type="button" onClick={() => ctrl.setBillingCustomer({ fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '9999999999', address: 'QUITO', email: '' })} className="text-xs font-medium bg-surface-900 text-white px-2.5 py-1 rounded-md hover:bg-surface-800 transition-colors duration-150">CF +</button>
                        </div>
                        <input type="text" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Nombres / Razón social" value={ctrl.billingCustomer?.fullName || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, fullName: e.target.value.toUpperCase() })} />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input type="text" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 pr-9 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Identificación" value={ctrl.billingCustomer?.documentId || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, documentId: e.target.value })} onBlur={() => lookupAndFillBillingCustomer(ctrl.billingCustomer?.documentId || '')} />
                            {isSearchingBillingClient && (
                              <Loader2 className="w-4 h-4 animate-spin text-primary-600 absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          <input type="text" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Ciudad" value={ctrl.billingCustomer?.address || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, address: e.target.value.toUpperCase() })} />
                        </div>
                        <input type="email" className="w-full bg-white border border-surface-300 px-3.5 py-2.5 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" placeholder="Correo electrónico (opcional)" value={ctrl.billingCustomer?.email || ''} onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, email: e.target.value.toLowerCase() })} />
                      </div>
                    )}

                    {saldo > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-surface-500">Método de liquidación</span>
                        <div className="grid grid-cols-2 gap-3">
                          {(['efectivo', 'transferencia'] as const).map(m => (
                            <button type="button" key={m} onClick={() => ctrl.setPaymentMethod(m)} className={`py-2.5 px-4 text-sm font-medium capitalize rounded-lg border transition-colors duration-150 ${ctrl.paymentMethod === m ? 'bg-surface-900 text-white border-surface-900' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'}`}>{m}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex-col sm:flex-row">
              <button type="button" onClick={closeModal} className="order-2 sm:order-1 flex-1 h-11 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors duration-150">Cancelar</button>
              <button type="button" onClick={ctrl.confirmStatusChange} disabled={ctrl.isConfirming} className="order-1 sm:order-2 flex-[2] bg-surface-900 text-white h-11 rounded-lg text-sm font-medium hover:bg-surface-800 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60">
                {ctrl.isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirmar cambio</>}
              </button>
            </ModalFooter>
          </Modal>
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
