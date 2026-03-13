import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const { orders } = useAppContext();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recibido': return 'bg-blue-100 text-blue-800';
      case 'diagnostico': return 'bg-yellow-100 text-yellow-800';
      case 'esperando_repuestos': return 'bg-orange-100 text-orange-800';
      case 'listo': return 'bg-green-100 text-green-800';
      case 'entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Bienvenido de vuelta</h2>
          <p className="text-gray-500 mt-1">Resumen del taller al día de hoy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Equipos', value: orders.length, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Listos para Entrega', value: orders.filter(o => o.status === 'listo').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'En Diagnóstico', value: orders.filter(o => o.status === 'diagnostico').length, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Esperando Repuestos', value: orders.filter(o => o.status === 'esperando_repuestos').length, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Ingresos Recientes</h3>
          <button onClick={() => navigate('/devices')} className="text-sm text-blue-600 font-medium hover:text-blue-700">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Orden</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Equipo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.customer.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.device.brand} {order.device.model}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Detalles</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay ingresos recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
