import React, { useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import { ChainDashboardService, type BranchStats } from '../../../services/ChainDashboardService';

export const ConsolidatedChainPanel: React.FC = () => {
  const [branches, setBranches] = useState<BranchStats[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    ChainDashboardService.getChainDashboard()
      .then(setBranches)
      .catch(err => console.error('Error loading chain dashboard:', err))
      .finally(() => setLoaded(true));
  }, []);

  // Sin grupo asignado (o todavía cargando): misma experiencia que hoy, sin panel.
  if (!loaded || branches.length === 0) return null;

  const totals = branches.reduce(
    (acc, b) => ({
      ordenesActivas: acc.ordenesActivas + b.ordenesActivas,
      ingresosMes: acc.ingresosMes + b.ingresosMes,
      egresosMes: acc.egresosMes + b.egresosMes,
    }),
    { ordenesActivas: 0, ingresosMes: 0, egresosMes: 0 }
  );

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden dark:bg-gray-900 dark:border-gray-800">
      <div className="p-4 sm:p-6 border-b border-surface-100 flex items-center gap-3 dark:border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0 dark:bg-gray-800 dark:text-gray-400">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-gray-100">Vista consolidada de la cadena</h2>
          <p className="text-xs text-surface-500 dark:text-gray-400">
            Números del mes por sucursal — {branches.length} sucursales
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[560px]">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800">
              <th className="px-4 md:px-6 py-3">Sucursal</th>
              <th className="px-4 md:px-6 py-3 text-right">Órdenes activas</th>
              <th className="px-4 md:px-6 py-3 text-right">Ingresos del mes</th>
              <th className="px-4 md:px-6 py-3 text-right">Egresos del mes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
            {branches.map(b => (
              <tr key={b.tenantId}>
                <td className="px-4 md:px-6 py-3.5 text-sm font-medium text-surface-900 dark:text-gray-100">
                  {b.sucursal}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm text-surface-600 text-right dark:text-gray-400">
                  {b.ordenesActivas}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm text-emerald-600 text-right font-medium dark:text-emerald-400">
                  ${b.ingresosMes.toFixed(2)}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-sm text-rose-600 text-right font-medium dark:text-rose-400">
                  ${b.egresosMes.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="bg-surface-50 dark:bg-gray-900/60">
              <td className="px-4 md:px-6 py-3.5 text-sm font-semibold text-surface-900 dark:text-gray-100">Total</td>
              <td className="px-4 md:px-6 py-3.5 text-sm font-semibold text-surface-900 text-right dark:text-gray-100">
                {totals.ordenesActivas}
              </td>
              <td className="px-4 md:px-6 py-3.5 text-sm font-semibold text-emerald-600 text-right dark:text-emerald-400">
                ${totals.ingresosMes.toFixed(2)}
              </td>
              <td className="px-4 md:px-6 py-3.5 text-sm font-semibold text-rose-600 text-right dark:text-rose-400">
                ${totals.egresosMes.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
