import React from 'react';
import { Camera, Edit2, MessageCircle, Printer, Trash2, Wrench } from 'lucide-react';
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
    <div className={`bg-white rounded-2xl border ${isSale ? 'border-primary-100' : 'border-surface-200'} overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col`}>
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            isSale ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-surface-600'
          }`}>
            #{order.orderNumber}
          </span>
          <div className="flex items-center gap-2">
            {!isSale && (
              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            )}
            <button 
              onClick={onEdit}
              className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              title="Editar Registro"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-full transition-colors"
              title="Eliminar Registro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
           {!isSale || order.device ? (
             <div>
               <h3 className="text-lg font-bold text-surface-900 leading-tight">
                 {order.device ? `${order.device.brand} ${order.device.model}` : 'VENTA GENERAL'}
               </h3>
               <div className="flex items-center gap-2 text-sm text-surface-500 mt-0.5">
                 <span>IMEI: {order.device?.serialNumber || 'N/A'}</span>
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-primary-600">
               <span className="text-lg font-bold">Nota de Venta</span>
             </div>
           )}

           <div className={`rounded-xl p-3 border ${isSale ? 'bg-primary-50/30 border-primary-100' : 'bg-surface-50 border-surface-100'}`}>
             <p className="text-sm font-medium text-surface-900 flex items-center gap-1.5 mb-1">
               {isSale ? (
                 <Printer className="w-4 h-4 text-primary-400" />
               ) : (
                 <Wrench className="w-4 h-4 text-surface-400" />
               )}
               {isSale ? 'Detalle de Cobro' : 'Falla Reportada'}
             </p>
             <p className="text-sm text-surface-600 line-clamp-2">
               {isSale ? 'Venta de productos/servicios en caja' : order.repair.reportedIssue}
             </p>
           </div>

           <div>
              <h4 className="text-sm font-semibold text-surface-900">Cliente</h4>
              <p className="text-sm text-surface-600">
                {order.customer.fullName || '—'}
                {order.customer.documentId ? ` • C.I: ${order.customer.documentId}` : ''}
              </p>
           </div>

           {!isSale && (
             <div className="pt-2">
               <button
                 onClick={onPhotos}
                 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
                   order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0 
                     ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200' 
                     : 'bg-surface-50 text-surface-700 hover:bg-surface-100 border-surface-200'
                 }`}
               >
                 <Camera className="w-4 h-4" />
                 {order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0 
                   ? `Gestionar Evidencias (${order.repair.evidencePhotos.length}/9)` 
                   : 'Añadir Evidencias (0/9)'}
               </button>
             </div>
           )}
        </div>
      </div>

      <div className="p-4 bg-surface-50/50 border-t border-surface-100 flex flex-col gap-3">
        {!isSale ? (
          <div className="w-full">
            <label className="sr-only">Cambiar Estado</label>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              title="Cambiar estado de la orden"
              className="w-full text-sm font-semibold rounded-xl px-3 py-2 cursor-pointer outline-none border border-surface-300 focus:ring-2 focus:ring-primary-500 text-surface-700 bg-white"
            >
              {statusList.map(opt => (
                <option key={opt} value={opt}>{getStatusLabel(opt)}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex justify-between items-center px-1">
            <span className="text-sm text-surface-500">Valor Total:</span>
            <span className="text-lg font-bold text-primary-600">
              ${Number(order.repair.repairTotalCost).toFixed(2)}
            </span>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-surface-100">
          {/* BOTONES PARA NOTAS DE VENTA (NT) */}
          {isSale ? (
            <button 
              onClick={onPrint}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm active:scale-95"
              title="Imprimir Nota de Venta"
            >
              <Printer className="w-4 h-4" /> 
              <span>Imprimir Nota de Venta</span>
            </button>
          ) : (
            /* BOTONES PARA REPARACIONES (REP) - ALINEADOS EN UNA SOLA FILA */
            <div className="flex gap-2 w-full mt-1">
              <button 
                onClick={onPrint}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm active:scale-95"
                title="Imprimir Ticket o Nota de Venta"
              >
                <Printer className="w-4 h-4" /> 
                <span>Imprimir</span>
              </button>

              <button 
                onClick={onNotify}
                className="flex-none w-12 h-11 flex items-center justify-center bg-[#25D366] text-white rounded-xl hover:bg-[#20BE5C] transition-colors shadow-sm active:scale-95"
                title="Enviar Mensaje de WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
