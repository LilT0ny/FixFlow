import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useRepuestoLookup } from '../../hooks/useRepuestoLookup';
import type { Repuesto } from '../../services/RepuestoService';

interface RepuestoPickerProps {
  onSelect: (repuesto: Repuesto) => void;
  placeholder?: string;
}

/**
 * Buscador de repuestos reusable (wizard de ingreso + edición de orden).
 * Mismo patrón que ya probó NuevaVentaModal, extraído acá para no
 * duplicarlo — pero sin tocar NuevaVentaModal, que ya está en producción.
 */
export const RepuestoPicker: React.FC<RepuestoPickerProps> = ({ onSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, isSearching } = useRepuestoLookup(isOpen ? query : '');

  const handleSelect = (repuesto: Repuesto) => {
    onSelect(repuesto);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-surface-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder || 'Buscar repuesto por nombre o SKU...'}
          className="w-full bg-white border border-surface-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg max-h-48 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          {isSearching ? (
            <div className="px-3 py-2 text-xs text-surface-500 dark:text-gray-400">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-surface-500 dark:text-gray-400">Sin coincidencias en el catálogo</div>
          ) : (
            results.map(r => (
              <button
                key={r.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-surface-50 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
              >
                <span className="text-surface-900 dark:text-gray-100 truncate">{r.nombre}</span>
                <span className="text-surface-500 dark:text-gray-400 shrink-0">${r.precioVenta.toFixed(2)} · Stock {r.stock}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
