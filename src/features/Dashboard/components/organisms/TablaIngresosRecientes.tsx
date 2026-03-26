import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ServiceOrder } from '../../../../types';
import { Card } from '../../../../components/atoms/Card';

interface TablaIngresosRecientesProps {
  ordenes: ServiceOrder[];
}

export const TablaIngresosRecientes: React.FC<TablaIngresosRecientesProps> = ({ ordenes }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recibido': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'diagnostico': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'esperando_repuestos': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'listo': return 'bg-success-100 text-success-800 border-success-200';
      case 'entregado': return 'bg-surface-100 text-surface-800 border-surface-200';
      default: return 'bg-surface-100 text-surface-800 border-surface-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };


  return (
    <Card className="overflow-hidden p-0 border-0 shadow-sm mt-6">
      <div className="px-6 py-5 border-b border-surface-100 flex justify-between items-center bg-white rounded-t-2xl">
        <h3 className="font-semibold text-surface-900">Ingresos Recientes</h3>
        <button onClick={() => navigate('/devices')} className="text-sm text-primary-600 font-bold hover:text-primary-700">Ver todos</button>
      </div>
      <div className="overflow-x-auto bg-white rounded-b-2xl">
        <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
          <thead>
            <tr className="bg-surface-50 text-surface-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-bold border-b border-surface-100">Orden</th>
              <th className="px-6 py-4 font-bold border-b border-surface-100">Cliente</th>
              <th className="px-4 py-4 font-bold border-b border-surface-100 hidden sm:table-cell">Equipo</th>
              <th className="px-6 py-4 font-bold border-b border-surface-100">Estado</th>
              <th className="px-6 py-4 font-bold border-b border-surface-100 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {ordenes.slice(0, 5).map(orden => (
              <tr key={orden.id} className="hover:bg-surface-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-bold text-surface-900 bg-surface-100 px-2 py-1 rounded-md text-xs">{orden.orderNumber}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-surface-700 truncate max-w-[120px] md:max-w-none">
                    {orden.customer.fullName}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-surface-700 hidden sm:table-cell">
                  {orden.device.brand} {orden.device.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${getStatusColor(orden.status)}`}>
                    {getStatusLabel(orden.status)}
                  </span>
                </td>
                <td className="px-6 py-4广告 text-right flex items-center justify-end gap-2">
                  <button 
                    onClick={() => navigate('/devices')} 
                    className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm font-bold bg-primary-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Detalles
                  </button>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-surface-500 font-medium bg-surface-50/30">
                  Aún no hay ingresos registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
