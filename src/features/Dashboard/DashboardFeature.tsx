import React from 'react';
import { Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/molecules/StatCard';
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-surface-900 leading-tight">Inicio</h2>
          <p className="text-[10px] md:text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80 leading-relaxed">
            Resumen Operativo y Estado del Taller en Tiempo Real
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard 
            key={i}
            title={stat.label}
            amount={stat.value}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bg}
            isCurrency={false}
            delay={`${i * 100}ms`}
          />
        ))}
      </div>

      <TablaIngresosRecientes ordenes={repairOrders} />
    </div>
  );
};
