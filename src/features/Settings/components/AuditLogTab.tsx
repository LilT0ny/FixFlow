import React, { useEffect, useState } from 'react';
import { History, ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { AuditLogService, type AuditLogEntry } from '../../../services/AuditLogService';
import { Badge, EmptyState } from '../../../components/design-system';
import { Pagination } from '../../../components/molecules/Pagination';
import { useToast } from '../../../store/ToastContext';
import { PAGE_SIZE } from '../../../constants/pagination';

const TABLE_LABELS: Record<string, string> = {
  clientes: 'Cliente',
  dispositivos: 'Equipo',
  ordenes_servicio: 'Orden de reparación',
  orden_trabajo: 'Costo de reparación',
  transacciones: 'Transacción',
  notas_venta: 'Nota de venta',
  usuarios: 'Usuario',
  ajustes: 'Configuración',
};

const ACTION_LABELS: Record<AuditLogEntry['action'], { label: string; variant: 'success' | 'info' | 'danger' }> = {
  insert: { label: 'Creó', variant: 'success' },
  update: { label: 'Editó', variant: 'info' },
  delete: { label: 'Eliminó', variant: 'danger' },
};

export const AuditLogTab: React.FC = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    AuditLogService.getAuditLog(page, PAGE_SIZE)
      .then(({ entries, total }) => {
        setEntries(entries);
        setTotal(total);
      })
      .catch(err => {
        console.error('Error loading audit log:', err);
        showToast('No se pudo cargar la bitácora de auditoría', 'error');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden dark:bg-gray-900 dark:border-gray-800">
      <div className="p-4 sm:p-6 border-b border-surface-100 flex items-center gap-3 dark:border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0 dark:bg-gray-800 dark:text-gray-400">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-gray-100">Auditoría</h2>
          <p className="text-xs text-surface-500 dark:text-gray-400">
            Quién cambió qué — {total} evento{total === 1 ? '' : 's'} registrado{total === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-surface-500 dark:text-gray-400">Cargando...</div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-5 h-5" />}
          title="Sin eventos todavía"
          description="Cuando se creen, editen o eliminen clientes, órdenes, transacciones o usuarios, va a aparecer acá."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800">
                <th className="px-4 md:px-6 py-3 w-8"></th>
                <th className="px-4 md:px-6 py-3">Fecha</th>
                <th className="px-4 md:px-6 py-3">Usuario</th>
                <th className="px-4 md:px-6 py-3">Entidad</th>
                <th className="px-4 md:px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
              {entries.map(entry => {
                const isExpanded = expandedId === entry.id;
                const action = ACTION_LABELS[entry.action];
                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="cursor-pointer hover:bg-surface-50 transition-colors duration-150 dark:hover:bg-gray-800/60"
                    >
                      <td className="px-4 md:px-6 py-3.5 text-surface-400 dark:text-gray-500">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-4 md:px-6 py-3.5">
                        <div className="text-sm text-surface-600 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5">
                        <div className="text-sm font-medium text-surface-900 dark:text-gray-100">
                          {entry.actorName}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5">
                        <span className="text-sm text-surface-700 dark:text-gray-300">
                          {TABLE_LABELS[entry.table] || entry.table}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3.5">
                        <Badge variant={action.variant}>{action.label}</Badge>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-4 md:px-6 py-4 bg-surface-50 dark:bg-gray-900/60">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-surface-500 mb-1.5 dark:text-gray-400">Antes</p>
                              <pre className="text-xs bg-white border border-surface-200 rounded-lg p-3 overflow-x-auto dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300">
                                {entry.before ? JSON.stringify(entry.before, null, 2) : '—'}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-surface-500 mb-1.5 dark:text-gray-400">Después</p>
                              <pre className="text-xs bg-white border border-surface-200 rounded-lg p-3 overflow-x-auto dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300">
                                {entry.after ? JSON.stringify(entry.after, null, 2) : '—'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} totalCount={total} onPageChange={setPage} />
    </div>
  );
};
