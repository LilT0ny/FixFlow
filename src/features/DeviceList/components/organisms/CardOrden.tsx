import React from 'react';
import { Camera, Edit2, MessageCircle, Printer, Trash2, Wrench, User, ShoppingBag } from 'lucide-react';
import type { OrderStatus, ServiceOrder } from '../../../../types';

interface CardOrdenProps {
  order: ServiceOrder;
  getStatusLabel: (s: OrderStatus) => string;
  getStatusColor: (s: OrderStatus) => string;
  onEdit: () => void;
  onDelete: () => void;
  onPhotos: () => void;
  onStatusChange: (newStatus: OrderStatus) => void;
  onPrint: () => void;
  onNotify: () => void;
}

export const CardOrden: React.FC<CardOrdenProps> = ({
  order, getStatusLabel, getStatusColor, onEdit, onDelete, onPhotos, onStatusChange, onPrint, onNotify
}) => {
  const statusList: OrderStatus[] = ['recibido', 'diagnostico', 'esperando_repuestos', 'listo', 'entregado'];
  const isSale = order.orderNumber.startsWith('NT');

  return (
    <div className={`bg-white rounded-xl border ${isSale ? 'border-primary-200' : 'border-surface-200'} overflow-hidden shadow-xs hover:shadow-sm hover:border-surface-300 transition-all duration-150 relative flex flex-col h-full`}>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center w-fit px-2 py-1 rounded-md text-xs font-mono font-medium ${
              isSale ? 'bg-primary-50 text-primary-700' : 'bg-surface-100 text-surface-700'
            }`}>
              #{order.orderNumber}
            </span>
            <span className="text-xs text-surface-400">
              {new Date(order.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors duration-150"
              title="Editar registro"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-150"
              title="Eliminar registro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {!isSale || order.device ? (
            <div>
              <h3 className="text-base font-semibold text-surface-900 leading-tight">
                {order.device ? `${order.device.brand} ${order.device.model}` : 'Venta general'}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-mono text-surface-500 mt-1.5 bg-surface-50 w-fit px-2 py-0.5 rounded">
                <span>IMEI/SN:</span>
                <span>{order.device?.serialNumber || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <h3 className="text-base font-semibold text-surface-900">Nota de venta</h3>
          )}

          <div className={`rounded-lg p-3.5 border ${isSale ? 'bg-primary-50/40 border-primary-100' : 'bg-surface-50 border-surface-200'}`}>
            <p className="text-xs font-medium text-surface-500 flex items-center gap-1.5 mb-1.5">
              {isSale ? (
                <ShoppingBag className="w-3.5 h-3.5" />
              ) : (
                <Wrench className="w-3.5 h-3.5" />
              )}
              {isSale ? 'Detalle de cobro' : 'Falla reportada'}
            </p>
            <p className="text-sm text-surface-700 leading-relaxed line-clamp-2">
              {isSale ? 'Venta de productos/servicios en caja' : order.repair.reportedIssue}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-surface-500">Cliente</p>
              <p className="text-sm font-medium text-surface-900 truncate">
                {order.customer.fullName || '—'}
              </p>
              {order.customer.documentId && (
                <p className="text-xs font-mono text-surface-400">ID: {order.customer.documentId}</p>
              )}
            </div>
          </div>

          {!isSale && (
            <button
              onClick={onPhotos}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 border ${
                order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0
                  ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'
                  : 'bg-white text-surface-700 hover:bg-surface-50 border-surface-300'
              }`}
            >
              <Camera className="w-4 h-4" />
              {order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0
                ? `Evidencias (${order.repair.evidencePhotos.length}/9)`
                : 'Cargar fotos'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 bg-surface-50 border-t border-surface-200 flex flex-col gap-3">
        {!isSale ? (
          <div className="w-full relative">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              title="Cambiar estado de la orden"
              className={`w-full text-sm font-medium rounded-lg px-3.5 py-2.5 cursor-pointer outline-none border transition-colors duration-150 appearance-none pr-10 ${getStatusColor(order.status)}`}
            >
              {statusList.map(opt => (
                <option key={opt} value={opt} className="bg-white text-surface-900">{getStatusLabel(opt)}</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white border border-surface-200">
            <span className="text-xs text-surface-500">Valor de la nota</span>
            <span className="text-lg font-semibold text-surface-900 tracking-tight">
              ${Number(order.repair.repairTotalCost).toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-900 text-white px-4 h-10 rounded-lg text-sm font-medium hover:bg-surface-800 transition-all duration-150 active:scale-[0.98]"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
            <span>{isSale ? 'Imprimir nota' : 'Imprimir'}</span>
          </button>

          {!isSale && (
            <button
              onClick={onNotify}
              className="flex-none w-10 h-10 flex items-center justify-center bg-[#25D366] text-white rounded-lg hover:bg-[#20BE5C] transition-colors duration-150 active:scale-[0.98]"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
