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
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <div className="text-sm font-bold text-surface-500 mr-2 uppercase tracking-wide">Filtros:</div>
      {flags.map((flag) => {
         const isActive = activeStatuses.includes(flag.id);
         return (
           <button
             key={flag.id}
             onClick={() => toggleStatus(flag.id)}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
               isActive 
                 ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200' 
                 : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50 hover:text-surface-900 hover:border-surface-300'
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
           className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-danger-600 hover:bg-danger-50 hover:text-danger-700 transition-all border border-transparent hover:border-danger-100 ml-auto"
           title="Limpiar filtros"
         >
           <X className="w-3.5 h-3.5" />
           Limpiar
         </button>
      )}
    </div>
  );
};
