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
    <div className={`group bg-white rounded-[32px] border ${isSale ? 'border-primary-100 shadow-primary-50/50' : 'border-surface-200'} overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative flex flex-col`}>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center w-fit px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
              isSale ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600'
            }`}>
              #{order.orderNumber}
            </span>
            <span className="text-[9px] text-surface-400 font-bold uppercase ml-1 opacity-60">
              {new Date(order.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-50/50 p-1 rounded-2xl border border-surface-100">
            <button 
              onClick={onEdit}
              className="p-2 text-surface-400 hover:text-primary-600 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90"
              title="Editar Registro"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-surface-400 hover:text-rose-600 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90"
              title="Eliminar Registro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-4 flex-1">
           {!isSale || order.device ? (
             <div>
               <h3 className="text-xl font-black text-surface-900 leading-tight tracking-tight group-hover:text-primary-600 transition-colors">
                 {order.device ? `${order.device.brand} ${order.device.model}` : 'VENTA GENERAL'}
               </h3>
               <div className="flex items-center gap-2 text-[11px] font-mono text-surface-400 mt-1 bg-surface-50 w-fit px-2 py-0.5 rounded-md border border-surface-100/50">
                 <span className="font-black">IMEI/SN:</span>
                 <span>{order.device?.serialNumber || 'N/A'}</span>
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-primary-600">
               <span className="text-xl font-black tracking-tight">Nota de Venta</span>
             </div>
           )}

           <div className={`rounded-2xl p-4 border transition-colors ${isSale ? 'bg-primary-50/30 border-primary-100' : 'bg-surface-50 border-surface-100'}`}>
             <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest flex items-center gap-2 mb-2">
               {isSale ? (
                 <ShoppingBag className="w-3.5 h-3.5 text-primary-500" />
               ) : (
                 <Wrench className="w-3.5 h-3.5 text-surface-400" />
               )}
               {isSale ? 'Detalle de Cobro' : 'Falla Reportada'}
             </p>
             <p className="text-sm text-surface-700 font-medium leading-relaxed line-clamp-2">
               {isSale ? 'Venta de productos/servicios en caja' : order.repair.reportedIssue}
             </p>
           </div>

           <div className="flex items-center gap-3 py-1">
              <div className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400 shrink-0 border border-surface-200 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest leading-none">Cliente Propietario</h4>
                <p className="text-sm font-bold text-surface-900 truncate mt-1">
                  {order.customer.fullName || '—'}
                </p>
                {order.customer.documentId && (
                  <p className="text-[10px] font-mono text-surface-500 opacity-70">ID: {order.customer.documentId}</p>
                )}
              </div>
           </div>

           {!isSale && (
             <div className="pt-2">
               <button
                 onClick={onPhotos}
                 className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-tight transition-all border ${
                   order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0 
                     ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200' 
                     : 'bg-surface-50 text-surface-700 hover:bg-surface-100 border-surface-200'
                 }`}
               >
                 <Camera className="w-4 h-4" />
                 {order.repair.evidencePhotos && order.repair.evidencePhotos.length > 0 
                   ? `Evidencias (${order.repair.evidencePhotos.length}/9)` 
                   : 'Cargar Fotos'}
               </button>
             </div>
           )}
        </div>
      </div>

      <div className="p-6 bg-surface-50/50 border-t border-surface-100 flex flex-col gap-4">
        {!isSale ? (
          <div className="w-full relative group/select">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              title="Cambiar estado de la orden"
              className={`w-full text-xs font-black uppercase tracking-widest rounded-2xl px-4 py-3 cursor-pointer outline-none border transition-all appearance-none pr-10 shadow-sm ${getStatusColor(order.status)}`}
            >
              {statusList.map(opt => (
                <option key={opt} value={opt} className="bg-white text-surface-900 font-bold">{getStatusLabel(opt)}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center px-2 bg-white/50 py-2 rounded-2xl border border-surface-100">
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Valor de la Nota</span>
            <span className="text-xl font-black text-primary-600 tracking-tight">
              ${Number(order.repair.repairTotalCost).toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-900 text-white px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-surface-200 active:scale-95"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" /> 
            <span>{isSale ? 'Imprimir Nota' : 'Imprimir'}</span>
          </button>

          {!isSale && (
            <button 
              onClick={onNotify}
              className="flex-none w-14 h-auto flex items-center justify-center bg-[#25D366] text-white rounded-2xl hover:bg-[#20BE5C] hover:scale-105 transition-all shadow-xl shadow-emerald-100 active:scale-95 group/wa"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="w-6 h-6 group-hover/wa:rotate-12 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
