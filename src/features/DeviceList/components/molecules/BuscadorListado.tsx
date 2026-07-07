import React from 'react';
import { Search } from 'lucide-react';

interface BuscadorListadoProps {
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
}

export const BuscadorListado: React.FC<BuscadorListadoProps> = ({ valor, alCambiar, placeholder = "Buscar..." }) => {
  return (
    <div className="relative w-full md:w-[440px] group">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4 group-focus-within:text-primary-600 transition-colors duration-150 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
};
