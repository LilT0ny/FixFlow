import React from 'react';
import { Camera, Edit2, MessageCircle, Printer, Trash2, Smartphone, User, Hash, FileText, ChevronDown, Wrench } from 'lucide-react';
import { Pagination } from '../../../../components/molecules/Pagination';
import type { OrderStatus, ServiceOrder } from '../../../../types';

interface TablaOrdenesProps {
  orders: ServiceOrder[];
  getStatusLabel: (s: OrderStatus) => string;
  getStatusColor: (s: OrderStatus) => string;
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
  onPhotos: (order: ServiceOrder) => void;
  onStatusChange: (order: ServiceOrder, newStatus: OrderStatus) => void;
  onPrint: (order: ServiceOrder) => void;
  onNotify: (order: ServiceOrder) => void;
  /** Paginación visual — orders ya viene recortado por página; totalCount es el total filtrado sin paginar. */
  pagination?: { page: number; pageSize: number; totalCount: number; onPageChange: (page: number) => void };
}

const STATUS_LIST: OrderStatus[] = ['recibido', 'diagnostico', 'esperando_repuestos', 'listo', 'entregado'];

/** Listado de órdenes en formato tabla (estética alineada al Dashboard) */
export const TablaOrdenes: React.FC<TablaOrdenesProps> = ({
  orders, getStatusLabel, getStatusColor, onEdit, onDelete, onPhotos, onStatusChange, onPrint, onNotify, pagination
}) => {
  const actionBtn = 'inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-150';

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden animate-fade-in-up dark:bg-gray-900 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800">
              <th className="px-4 md:px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Orden
                </div>
              </th>
              <th className="px-4 md:px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Cliente
                </div>
              </th>
              <th className="px-4 md:px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Equipo
                </div>
              </th>
              <th className="px-4 md:px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Trabajo a realizar
                </div>
              </th>
              <th className="px-4 md:px-5 py-3">Estado</th>
              <th className="px-4 md:px-5 py-3 text-right">Valor</th>
              <th className="px-4 md:px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
            {orders.map(order => {
              const total = Number(order.repair.repairTotalCost) || 0;
              const abono = Number(order.repair.initialDeposit) || 0;
              const saldo = Math.max(0, total - abono);
              const fotos = order.repair.evidencePhotos?.length || 0;

              return (
                <tr key={order.id} className="hover:bg-surface-50 transition-colors duration-150 dark:hover:bg-gray-800/60">
                  {/* Orden + fecha + nota vinculada */}
                  <td className="px-4 md:px-5 py-3.5">
                    <span className="font-mono text-xs font-medium px-2 py-1 rounded-md bg-surface-100 text-surface-700 dark:bg-gray-800 dark:text-gray-300">
                      {order.orderNumber}
                    </span>
                    <p className="text-xs text-surface-400 mt-1.5 dark:text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {order.notaVenta && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary-50 text-primary-700 border border-primary-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" title={`Nota de venta ${order.notaVenta.numero}`}>
                        <FileText className="w-3 h-3" />
                        {order.notaVenta.numero}
                      </span>
                    )}
                  </td>

                  {/* Cliente */}
                  <td className="px-4 md:px-5 py-3.5">
                    <div className="text-sm font-medium text-surface-900 truncate max-w-[160px] dark:text-gray-100">
                      {order.customer.fullName || '—'}
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5 font-mono dark:text-gray-400">
                      {order.customer.documentId || order.customer.phone || '—'}
                    </p>
                  </td>

                  {/* Equipo */}
                  <td className="px-4 md:px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0 dark:bg-gray-800">
                        <Smartphone className="w-4 h-4 text-surface-500 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-surface-900 truncate max-w-[180px] dark:text-gray-100">
                          {order.device ? `${order.device.brand} ${order.device.model}` : 'N/A'}
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5 truncate max-w-[180px] dark:text-gray-400">
                          IMEI: {order.device?.serialNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Trabajo a realizar / falla reportada */}
                  <td className="px-4 md:px-5 py-3.5 max-w-[220px]">
                    <p className="text-sm text-surface-700 leading-snug line-clamp-2 dark:text-gray-300">
                      {order.repair.reportedIssue || <span className="text-surface-400 dark:text-gray-500">Sin especificar</span>}
                    </p>
                  </td>

                  {/* Estado */}
                  <td className="px-4 md:px-5 py-3.5">
                    <div className="relative w-fit">
                      <select
                        value={order.status}
                        onChange={(e) => onStatusChange(order, e.target.value as OrderStatus)}
                        title="Cambiar estado de la orden"
                        className={`text-xs font-medium rounded-md pl-2.5 pr-7 py-1.5 cursor-pointer outline-none border transition-colors duration-150 appearance-none ${getStatusColor(order.status)}`}
                      >
                        {STATUS_LIST.map(opt => (
                          <option key={opt} value={opt} className="bg-white text-surface-900 dark:bg-gray-800 dark:text-gray-100">{getStatusLabel(opt)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </td>

                  {/* Valor */}
                  <td className="px-4 md:px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-surface-900 tracking-tight dark:text-gray-100">
                      ${total.toFixed(2)}
                    </span>
                    {saldo > 0 ? (
                      <p className="text-xs font-medium text-amber-600 mt-0.5 dark:text-amber-400">Saldo ${saldo.toFixed(2)}</p>
                    ) : total > 0 ? (
                      <p className="text-xs font-medium text-emerald-600 mt-0.5 dark:text-emerald-400">Pagado</p>
                    ) : null}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 md:px-5 py-3.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => onPhotos(order)}
                        className={`${actionBtn} relative ${fotos > 0
                          ? 'text-primary-600 hover:bg-primary-50 dark:text-blue-400 dark:hover:bg-blue-950/30'
                          : 'text-surface-400 hover:text-surface-900 hover:bg-surface-100 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800'}`}
                        title={fotos > 0 ? `Evidencias (${fotos})` : 'Cargar fotos'}
                      >
                        <Camera className="w-4 h-4" />
                        {fotos > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-600 text-white text-[9px] font-semibold flex items-center justify-center">
                            {fotos}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => onNotify(order)}
                        className={`${actionBtn} text-[#25D366] hover:bg-emerald-50 dark:hover:bg-emerald-950/30`}
                        title="Notificar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPrint(order)}
                        className={`${actionBtn} text-surface-400 hover:text-surface-900 hover:bg-surface-100 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800`}
                        title="Imprimir ticket / nota"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(order)}
                        className={`${actionBtn} text-surface-400 hover:text-surface-900 hover:bg-surface-100 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800`}
                        title="Editar registro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(order)}
                        className={`${actionBtn} text-surface-400 hover:text-danger-600 hover:bg-danger-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-950/30`}
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Smartphone className="w-10 h-10 text-surface-300 dark:text-gray-700" />
                    <p className="text-sm text-surface-500 dark:text-gray-400">Sin correspondencias encontradas</p>
                    <p className="text-xs text-surface-400 dark:text-gray-500">Probá ajustando los criterios de búsqueda o los filtros.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
};
