import React from 'react';
import { Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { CardEstadistica } from './components/molecules/CardEstadistica';
import { TablaIngresosRecientes } from './components/organisms/TablaIngresosRecientes';

// MVC Controller
import { useOrders } from '../../hooks/useOrders';

export const DashboardFeature: React.FC = () => {
  const { orders } = useOrders();

  // Filtrar solo reparaciones para las estadísticas y el listado de dispositivos
  const repairOrders = orders.filter(o => o.orderNumber.startsWith('REP'));

  const stats = [
    { label: 'Equipos en Taller', value: repairOrders.length, icon: Wrench, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Listos para Entrega', value: repairOrders.filter(o => o.status === 'listo').length, icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-50' },
    { label: 'En Diagnóstico', value: repairOrders.filter(o => o.status === 'diagnostico').length, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
    { label: 'Esperando Repuestos', value: repairOrders.filter(o => o.status === 'esperando_repuestos').length, icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">Inicio</h2>
          <p className="text-gray-500">Resumen del taller al día de hoy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <CardEstadistica 
            key={i}
            titulo={stat.label}
            valor={stat.value}
            icono={stat.icon}
            colorIcono={stat.color}
            fondoIcono={stat.bg}
          />
        ))}
      </div>

      <TablaIngresosRecientes ordenes={repairOrders} />
    </div>
  );
};
