import React, { useState } from 'react';
import { Wrench, CheckCircle, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { StatCard } from '../../components/molecules/StatCard';
import { PageHeader } from '../../components/design-system';
import { DevicesPanel } from '../DeviceList/DevicesPanel';
import { NuevaVentaModal } from './components/organisms/NuevaVentaModal';
import { useAppContext } from '../../store/AppContext';

export const DashboardFeature: React.FC = () => {
  // Misma fuente de datos que el panel de dispositivos: los KPI reaccionan
  // en vivo a los cambios de estado hechos en la tabla.
  const { orders } = useAppContext();
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const stats = [
    { label: 'Equipos en Taller', value: orders.length, icon: Wrench, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Listos para Entrega', value: orders.filter(o => o.status === 'listo').length, icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-50' },
    { label: 'En Diagnóstico', value: orders.filter(o => o.status === 'diagnostico').length, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
    { label: 'Esperando Repuestos', value: orders.filter(o => o.status === 'esperando_repuestos').length, icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-50' }
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Inicio"
        subtitle="Monitoreo y gestión de equipos en taller"
      >
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="w-full sm:w-auto bg-white border border-surface-300 text-surface-700 px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-50 transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
        >
          <ShoppingBag className="w-4 h-4" />
          Nueva venta
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
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

      <DevicesPanel />

      <NuevaVentaModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} />
    </div>
  );
};
