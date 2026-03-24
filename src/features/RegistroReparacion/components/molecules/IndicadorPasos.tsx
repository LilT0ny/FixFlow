import React from 'react';
import { ClipboardList, Smartphone, Wrench } from 'lucide-react';

interface IndicadorPasosProps {
  pasoActual: number;
  totalPasos: number;
}

export const IndicadorPasos: React.FC<IndicadorPasosProps> = ({ pasoActual, totalPasos }) => {
  const pasos = [
    { num: 1, title: 'Cliente', icon: ClipboardList },
    { num: 2, title: 'Equipo', icon: Smartphone },
    { num: 3, title: 'Detalles', icon: Wrench },
  ];

  return (
    <div className="pt-8 pb-4">
      <div className="mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-100 rounded-full -translate-y-1/2"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary-600 rounded-full -translate-y-1/2 transition-all duration-500 ease-in-out"
          style={{ width: `${((pasoActual - 1) / (totalPasos - 1)) * 100}%` }}
        ></div>
        
        <div className="relative flex justify-between">
          {pasos.map(({ num, title, icon: Icon }) => (
            <div key={num} className="flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                  pasoActual >= num 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                    : 'bg-white text-surface-400 border-2 border-surface-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold ${pasoActual >= num ? 'text-surface-800' : 'text-surface-400'}`}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
