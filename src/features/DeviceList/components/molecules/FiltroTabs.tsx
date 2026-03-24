import React from 'react';
import { CheckCircle, Clock, FileText, Smartphone } from 'lucide-react';
import type { FilterTab } from '../../hooks/useDeviceList';

interface FiltroTabsProps {
  filtroActual: FilterTab;
  alCambiar: (filtro: FilterTab) => void;
}

export const FiltroTabs: React.FC<FiltroTabsProps> = ({ filtroActual, alCambiar }) => {
  const tabs = [
    { id: 'all', label: 'Todos', icon: FileText },
    { id: 'pendientes', label: 'Pendientes', icon: Clock },
    { id: 'reparados', label: 'Reparados', icon: CheckCircle },
    { id: 'entregados', label: 'Entregados', icon: Smartphone }
  ];

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {tabs.map((tab) => {
         const esSeleccionado = filtroActual === tab.id;
         return (
           <button
             key={tab.id}
             onClick={() => alCambiar(tab.id as FilterTab)}
             className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
               esSeleccionado 
                 ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                 : 'bg-surface-100 text-surface-600 hover:bg-surface-200 hover:text-surface-900'
             }`}
           >
             <tab.icon className="w-4 h-4" />
             {tab.label}
           </button>
         );
      })}
    </div>
  );
};
