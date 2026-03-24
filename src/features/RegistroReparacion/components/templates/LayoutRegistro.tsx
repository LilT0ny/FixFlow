import React, { type ReactNode } from 'react';

interface LayoutRegistroProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

export const LayoutRegistro: React.FC<LayoutRegistroProps> = ({ titulo, subtitulo, children }) => {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border border-surface-100 overflow-hidden">
        
        {/* Header styling con Tema Global */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 sm:px-10 py-8 text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl flex-shrink-0"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{titulo}</h2>
            <p className="text-primary-100/90 font-medium">{subtitulo}</p>
          </div>
        </div>

        <div className="px-6 sm:px-10 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
};
