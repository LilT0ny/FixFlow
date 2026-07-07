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
      case 'recibido': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'diagnostico': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'esperando_repuestos': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'listo': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'entregado': return 'bg-surface-100 text-surface-600 border-surface-200';
      default: return 'bg-surface-100 text-surface-600 border-surface-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden animate-fade-in-up">
      <div className="flex flex-col sm:flex-row px-4 md:px-6 py-4 border-b border-surface-200 justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-semibold text-surface-900">Ingresos recientes</h3>
          <p className="text-sm text-surface-500 mt-0.5">Últimos equipos registrados</p>
        </div>
        <button
          onClick={() => navigate('/devices')}
          className="w-full sm:w-auto group flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 bg-white hover:bg-surface-50 border border-surface-300 rounded-lg transition-colors duration-150"
        >
          Ver todos
          <ChevronRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200">
              <th className="px-4 md:px-6 py-3">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Orden
                </div>
              </th>
              <th className="px-4 md:px-6 py-3">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Cliente
                </div>
              </th>
              <th className="px-4 md:px-6 py-3 hidden md:table-cell">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Equipo
                </div>
              </th>
              <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Estado</th>
              <th className="px-4 md:px-6 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {ordenes.slice(0, 8).map(orden => (
              <tr key={orden.id} className="hover:bg-surface-50 transition-colors duration-150">
                <td className="px-4 md:px-6 py-3.5">
                  <span className="font-mono text-xs font-medium text-surface-700 bg-surface-100 px-2 py-1 rounded-md">{orden.orderNumber}</span>
                </td>
                <td className="px-4 md:px-6 py-3.5">
                  <div className="text-sm font-medium text-surface-900 truncate max-w-[140px] md:max-w-none">
                    {orden.customer.fullName}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{orden.customer.phone || 'Sin teléfono'}</p>
                  <div className="sm:hidden mt-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(orden.status)}`}>
                      {getStatusLabel(orden.status)}
                    </span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-3.5 hidden md:table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4 text-surface-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-surface-900 truncate">
                        {orden.device ? `${orden.device.brand} ${orden.device.model}` : 'N/A'}
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5 truncate">IMEI: {orden.device?.serialNumber || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(orden.status)}`}>
                    {getStatusLabel(orden.status)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3.5 text-right">
                  <button
                    onClick={() => navigate('/devices')}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-150"
                    title="Ver detalles"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Smartphone className="w-10 h-10 text-surface-300" />
                    <p className="text-sm text-surface-500">
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
