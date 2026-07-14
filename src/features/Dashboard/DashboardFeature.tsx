import React, { useState } from 'react';
import { Wrench, CheckCircle, Clock, AlertCircle, ShoppingBag, SquarePlus } from 'lucide-react';
import { StatCard } from '../../components/molecules/StatCard';
import { PageHeader } from '../../components/design-system';
import { DevicesPanel } from '../DeviceList/DevicesPanel';
import { NuevaVentaModal } from './components/organisms/NuevaVentaModal';
import { NewDeviceModal } from './components/organisms/NewDeviceModal';
import { ConsolidatedChainPanel } from './components/ConsolidatedChainPanel';
import { useAppContext } from '../../store/AppContext';

export const DashboardFeature: React.FC = () => {
  // Misma fuente de datos que el panel de dispositivos: los KPI reaccionan
  // en vivo a los cambios de estado hechos en la tabla.
  const { orders, authUser, canAccessModule } = useAppContext();
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const stats = [
    { label: 'Equipos en Taller', value: orders.length, icon: Wrench, color: 'text-primary-600 dark:text-blue-400', bg: 'bg-primary-50 dark:bg-blue-950/40' },
    { label: 'Listos para Entrega', value: orders.filter(o => o.status === 'listo').length, icon: CheckCircle, color: 'text-success-600 dark:text-emerald-400', bg: 'bg-success-50 dark:bg-emerald-950/40' },
    { label: 'En Diagnóstico', value: orders.filter(o => o.status === 'diagnostico').length, icon: Clock, color: 'text-warning-600 dark:text-amber-400', bg: 'bg-warning-50 dark:bg-amber-950/40' },
    { label: 'Esperando Repuestos', value: orders.filter(o => o.status === 'esperando_repuestos').length, icon: AlertCircle, color: 'text-danger-600 dark:text-red-400', bg: 'bg-danger-50 dark:bg-red-950/40' }
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Inicio"
        subtitle="Monitoreo y gestión de equipos en taller"
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {canAccessModule('registro') && (
            <button
              onClick={() => setIsRegistrationModalOpen(true)}
              className="w-full sm:w-auto bg-white border border-surface-300 text-surface-700 px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-50 transition-all duration-150 active:scale-[0.98] whitespace-nowrap dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <SquarePlus className="w-4 h-4" />
              Nuevo ingreso
            </button>
          )}
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="w-full sm:w-auto bg-white border border-surface-300 text-surface-700 px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-50 transition-all duration-150 active:scale-[0.98] whitespace-nowrap dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ShoppingBag className="w-4 h-4" />
            Nueva venta
          </button>
        </div>
      </PageHeader>

      {authUser?.role === 'owner' && <ConsolidatedChainPanel />}

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
      <NewDeviceModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} />
    </div>
  );
};
