import React from 'react';
import { Package, Smartphone, Settings, CheckCircle, ShieldCheck, X } from 'lucide-react';
import type { OrderStatus } from '../../../../types';

interface FiltroTabsProps {
  activeStatuses: OrderStatus[];
  toggleStatus: (status: OrderStatus) => void;
  clearStatuses: () => void;
}

export const FiltroTabs: React.FC<FiltroTabsProps> = ({ activeStatuses, toggleStatus, clearStatuses }) => {
  const flags: { id: OrderStatus; label: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'recibido', label: 'Recibidos', icon: Package },
    { id: 'diagnostico', label: 'En Diagnóstico', icon: Smartphone },
    { id: 'esperando_repuestos', label: 'En Espera (Repuestos)', icon: Settings },
    { id: 'listo', label: 'Listos', icon: CheckCircle },
    { id: 'entregado', label: 'Entregados', icon: ShieldCheck }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-xs font-medium text-surface-500 mr-1 whitespace-nowrap dark:text-gray-400">Filtros:</div>
      {flags.map((flag) => {
         const isActive = activeStatuses.includes(flag.id);
         return (
           <button
             key={flag.id}
             onClick={() => toggleStatus(flag.id)}
             className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 border ${
               isActive
                 ? 'bg-surface-900 text-white border-surface-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                 : 'bg-white text-surface-600 border-surface-300 hover:text-surface-900 hover:border-surface-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:text-gray-100 dark:hover:border-gray-600'
             }`}
           >
             <flag.icon className="w-3.5 h-3.5" />
             {flag.label}
           </button>
         );
      })}

      {activeStatuses.length > 0 && (
         <button
           onClick={clearStatuses}
           className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors duration-150 ml-auto animate-fade-in dark:text-red-400 dark:hover:bg-red-950/30"
           title="Limpiar filtros"
         >
           <X className="w-3.5 h-3.5" />
           Limpiar
         </button>
      )}
    </div>
  );
};
