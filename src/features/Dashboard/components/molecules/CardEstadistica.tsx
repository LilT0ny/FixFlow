import React from 'react';
import type { LucideIcon } from 'lucide-react';


interface CardEstadisticaProps {
  titulo: string;
  valor: string | number;
  icono: LucideIcon;
  colorIcono: string;
  fondoIcono: string;
}

export const CardEstadistica: React.FC<CardEstadisticaProps> = ({ titulo, valor, icono: Icono, colorIcono, fondoIcono }) => {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-surface-200 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-all duration-300 cursor-default group animate-in zoom-in duration-500">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-surface-100/50 shadow-sm transition-transform group-hover:rotate-12 ${fondoIcono}`}>
        <Icono className={`w-6 h-6 ${colorIcono}`} />
      </div>
      <div>
        <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] leading-none mb-2">{titulo}</p>
        <h3 className="text-3xl font-black text-surface-900 leading-none tracking-tight">{valor}</h3>
      </div>
    </div>
  );
};
