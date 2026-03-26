import React from 'react';
import { Search, MessageCircle, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { useDeviceList } from './hooks/useDeviceList';
import { BuscadorListado } from './components/molecules/BuscadorListado';
import { FiltroTabs } from './components/molecules/FiltroTabs';
import { CardOrden } from './components/organisms/CardOrden';
import { PrintManager } from '../../components/organisms/PrintManager';
import { EditOrderModal } from './components/organisms/EditOrderModal';

/** Layout Feature para la lista de dispositivos registrados */
export const DeviceListFeature: React.FC = () => {
  const ctrl = useDeviceList();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">
            Lista de Reparaciones
          </h2>
          <p className="text-gray-500">
            Gestiona el estado y entrega de dispositivos recibidos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 space-y-4">
        <BuscadorListado valor={ctrl.search} alCambiar={ctrl.setSearch} placeholder="Buscar por Nombre, Cédula o IMEI..." />
        <FiltroTabs activeStatuses={ctrl.activeStatuses} toggleStatus={ctrl.toggleStatus} clearStatuses={ctrl.clearStatuses} />
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

      {/* ─── Modal: Confirmar Eliminación ─── */}
      {ctrl.deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-danger-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-center text-surface-900 mb-2">¿Eliminar Registro?</h3>
            <p className="text-sm text-center text-surface-500 mb-4">Esta acción marca la orden como eliminada en la base de datos.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => ctrl.setDeleteConfirmModal(null)}
                className="flex-1 border border-surface-300 rounded-xl font-bold py-3 hover:bg-surface-50"
              >
                Cancelar
              </button>
              <button
                onClick={ctrl.confirmDelete}
                className="flex-1 bg-danger-600 text-white rounded-xl font-bold py-3 hover:bg-danger-700"
              >
                Sí, Eliminar
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

        // Datos de costos calculados desde la BD (no manual input)
        const total = Number(order?.repair?.repairTotalCost) || 0;
        const abono = Number(order?.repair?.initialDeposit)  || 0;
        const saldo = Math.max(0, total - abono);

        return (
          <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-primary-600" />
                  </div>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-center text-surface-900 mb-2">¿Actualizar Estado?</h3>
                <p className="text-sm text-center text-surface-500 mb-4 font-medium">
                  El dispositivo pasará a:{' '}
                  <strong className="text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                    {ctrl.getStatusLabel(newStatus)}
                  </strong>
                </p>

                {newStatus !== 'entregado' && (
                  <p className="text-sm text-center text-surface-500 italic">
                    Al confirmar, se abrirá WhatsApp automáticamente para notificar al cliente.
                  </p>
                )}

                {/* ─── Panel exclusivo de ENTREGADO ─── */}
                {newStatus === 'entregado' && (
                  <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 space-y-4 mt-2">

                    {/* Resumen de costos desde BD */}
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-xs text-surface-500 uppercase font-black">
                        Detalle de Cobro
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-surface-600">Costo Total:</span>
                        <span className="font-semibold text-surface-900">${total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-surface-600">Abono Inicial:</span>
                        <span className="font-semibold text-success-600">-${abono.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-surface-200 pt-2">
                        <span className="font-bold text-surface-900">Saldo Pendiente:</span>
                        <span className={`font-black text-xl ${saldo > 0 ? 'text-primary-600' : 'text-success-600'}`}>
                          ${saldo.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Opción de Nota de Venta */}
                    <div className="pt-2">
                       <label className="flex items-center gap-3 p-3 bg-white border border-surface-200 rounded-2xl cursor-pointer hover:bg-surface-50 transition-colors">
                          <input 
                            type="checkbox"
                            className="w-5 h-5 rounded-lg text-primary-600 focus:ring-primary-500 border-surface-300"
                            checked={ctrl.generateSalesNote}
                            onChange={e => {
                                ctrl.setGenerateSalesNote(e.target.checked);
                                if (e.target.checked && !ctrl.billingCustomer) {
                                  // Pre-cargar datos del cliente original si se activa
                                  const ord = ctrl.orders.find(o => o.id === ctrl.statusConfirmModal?.orderId);
                                  if (ord) ctrl.setBillingCustomer({ ...ord.customer, address: ord.customer.address || 'QUITO' });
                                }
                            }}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-bold text-surface-900 block">Generar Nota de Venta</span>
                            <span className="text-[10px] text-surface-500 uppercase font-bold tracking-tight">Incluir datos del cliente para factura</span>
                          </div>
                       </label>
                    </div>

                    {/* Datos de Facturación (Solo si se activó la nota) */}
                    {ctrl.generateSalesNote && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                            Datos para la Facturación
                          </label>
                          <button
                            type="button"
                            onClick={() => ctrl.setBillingCustomer({
                              fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999',
                              phone: '9999999999', address: 'QUITO',
                              email: ''
                            })}
                            className="text-[10px] bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-0.5 rounded-lg font-bold transition-colors"
                          >
                           + Consumidor Final
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white uppercase font-black focus:ring-2 focus:ring-primary-500"
                            placeholder="Nombres / Razón Social"
                            value={ctrl.billingCustomer?.fullName || ''}
                            onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, fullName: e.target.value.toUpperCase() })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white font-bold"
                              placeholder="Cédula / RUC"
                              value={ctrl.billingCustomer?.documentId || ''}
                              onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, documentId: e.target.value })}
                            />
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white uppercase font-bold"
                              placeholder="Ciudad"
                              value={ctrl.billingCustomer?.address || ''}
                              onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, address: e.target.value.toUpperCase() })}
                            />
                             <input
                              type="text"
                              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white font-bold"
                              placeholder="Teléfono"
                              value={ctrl.billingCustomer?.phone || ''}
                              onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, phone: e.target.value })}
                            />
                             <input
                              type="email"
                              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-xs bg-white font-bold"
                              placeholder="Email"
                              value={ctrl.billingCustomer?.email || ''}
                              onChange={e => ctrl.setBillingCustomer({ ...ctrl.billingCustomer!, email: e.target.value.toLowerCase() })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Método de pago (solo si hay saldo) */}
                    {saldo > 0 && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                          Método de pago del saldo
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['efectivo', 'transferencia'] as const).map(m => (
                            <button
                              key={m}
                              onClick={() => ctrl.setPaymentMethod(m)}
                              className={`py-2 px-3 text-[11px] font-bold rounded-xl border transition-all ${
                                ctrl.paymentMethod === m
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-[1.02]'
                                    : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                              }`}
                            >
                              {m.toUpperCase()}
                            </button>
                          ))}
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
                      ctrl.setPaymentMethod('efectivo');
                      ctrl.setBillingCustomer(null);
                    }}
                    disabled={ctrl.isConfirming}
                    className="flex-1 bg-white border border-surface-300 text-surface-700 py-3 px-4 rounded-xl font-bold hover:bg-surface-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={ctrl.confirmStatusChange}
                    disabled={ctrl.isConfirming}
                    className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {ctrl.isConfirming
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                      : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Modal: Editar Orden ─── */}
      <EditOrderModal
        isOpen={!!(ctrl.editModal?.isOpen && ctrl.editModal.order)}
        order={ctrl.editModal?.order ?? null}
        onClose={() => ctrl.setEditModal(null)}
        onSave={ctrl.confirmEditSave}
      />

      {/* ─── Modal: Eliminar Orden/Nota ─── */}
      {ctrl.deleteConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center text-surface-900 mb-2">¿Eliminar Registro?</h3>
            <p className="text-center text-surface-500 text-sm mb-6">
              Esta acción marcará la orden o nota como eliminada y ya no aparecerá en el listado principal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => ctrl.setDeleteConfirmModal({ isOpen: false, orderId: '' })}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-100 text-surface-700 hover:bg-surface-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => ctrl.confirmDelete()}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-danger-600 text-white hover:bg-danger-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Configuración de Impresión Multiformato ─── */}
      <PrintManager
        isOpen={ctrl.isPrintModalOpen}
        order={ctrl.orderToPrint}
        onClose={() => ctrl.setIsPrintModalOpen(false)}
      />

      {/* ─── Toast de Éxito (confirmación de BD) ─── */}
      {ctrl.successMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-success-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{ctrl.successMessage}</span>
        </div>
      )}
    </div>
  );
};
