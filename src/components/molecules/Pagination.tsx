import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** 1-indexado */
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

/**
 * Paginación genérica reusada por las vistas de tabla server-side
 * (Clientes, Inventario, Auditoría, Sesiones) y por la paginación
 * visual client-side de Dispositivos/Órdenes.
 */
export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, totalCount, onPageChange }) => {
  if (totalCount === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-surface-200 dark:border-gray-800">
      <p className="text-xs text-surface-500 dark:text-gray-400">
        Mostrando <span className="font-medium text-surface-700 dark:text-gray-300">{from}–{to}</span> de{' '}
        <span className="font-medium text-surface-700 dark:text-gray-300">{totalCount}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-surface-700 dark:text-gray-300 min-w-[88px] text-center">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
