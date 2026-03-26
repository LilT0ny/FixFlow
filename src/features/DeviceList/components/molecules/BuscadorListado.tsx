import React from 'react';
import { Search } from 'lucide-react';

interface BuscadorListadoProps {
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
}

export const BuscadorListado: React.FC<BuscadorListadoProps> = ({ valor, alCambiar, placeholder = "Buscar..." }) => {
  return (
    <div className="relative w-full md:w-[500px] group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors pointer-events-none" />
      <input 
        type="text" 
        placeholder={placeholder}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="w-full pl-12 pr-6 py-3.5 bg-white border border-surface-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm shadow-sm"
      />
    </div>
  );
};
