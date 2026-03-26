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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <input 
        type="text" 
        placeholder={placeholder}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      />
    </div>
  );
};
