import React from 'react';
import { Search } from 'lucide-react';

interface BuscadorListadoProps {
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
}

export const BuscadorListado: React.FC<BuscadorListadoProps> = ({ valor, alCambiar, placeholder = "Buscar..." }) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
      <input 
        type="text" 
        placeholder={placeholder}
        value={valor}
        onChange={(e) => alCambiar(e.target.value.toUpperCase())}
        className="pl-10 pr-4 py-3 w-full border border-surface-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-surface-700 bg-surface-50 hover:bg-white uppercase"
      />
    </div>
  );
};
