import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ServiceOrder } from '../../../../types';
import { ChevronRight, Smartphone, User, Hash } from 'lucide-react';

interface TablaIngresosRecientesProps {
  ordenes: ServiceOrder[];
}

export const TablaIngresosRecientes: React.FC<TablaIngresosRecientesProps> = ({ ordenes }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recibido': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'diagnostico': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'esperando_repuestos': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'listo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'entregado': return 'bg-surface-100 text-surface-600 border-surface-200';
      default: return 'bg-surface-100 text-surface-600 border-surface-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };


  return (
    <div className="bg-white rounded-[32px] border border-surface-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-8 py-6 border-b border-surface-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="font-black text-surface-900 tracking-tight">Ingresos Recientes</h3>
          <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">Últimos equipos registrados</p>
        </div>
        <button 
          onClick={() => navigate('/devices')} 
          className="group flex items-center gap-1.5 px-4 py-2 bg-surface-50 hover:bg-primary-50 text-surface-600 hover:text-primary-600 rounded-xl transition-all duration-300 active:scale-95"
        >
          <span className="text-xs font-black uppercase tracking-tight">Ver Dashboard Completo</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-50/50">
              <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" />
                  Orden
                </div>
              </th>
              <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Cliente
                </div>
              </th>
              <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  Equipo
                </div>
              </th>
              <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100">Estado</th>
              <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {ordenes.slice(0, 8).map(orden => (
              <tr key={orden.id} className="hover:bg-surface-50/70 transition-colors group">
                <td className="px-8 py-5">
                  <span className="font-black text-surface-900 bg-surface-100 px-3 py-1.5 rounded-xl text-xs tracking-tight shadow-sm border border-surface-200/50">{orden.orderNumber}</span>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-black text-surface-900 leading-none">
                    {orden.customer.fullName}
                  </div>
                  <p className="text-[10px] text-surface-400 mt-1.5 font-medium leading-none">{orden.customer.phone || 'Sin teléfono'}</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center border border-surface-100">
                       <Smartphone className="w-4 h-4 text-surface-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-surface-700 leading-none">
                        {orden.device ? `${orden.device.brand} ${orden.device.model}` : 'N/A'}
                      </div>
                      <p className="text-[10px] text-surface-400 mt-1 font-medium leading-none uppercase tracking-tighter">Imei: {orden.device?.serialNumber || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(orden.status)}`}>
                    {getStatusLabel(orden.status)}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => navigate('/devices')} 
                    className="inline-flex items-center justify-center p-2.5 bg-white border border-surface-200 text-surface-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 rounded-xl transition-all duration-300 shadow-sm active:scale-90 group-hover:scale-110"
                    title="Ver detalles"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                    <Smartphone className="w-12 h-12 text-surface-300" />
                    <p className="text-sm font-black text-surface-400 uppercase tracking-widest">
                      Sin ingresos registrados
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
