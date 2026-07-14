import React, { useEffect, useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { PageHeader, Badge, EmptyState } from '../../components/design-system';
import { Pagination } from '../../components/molecules/Pagination';
import { SessionAuditService, type SessionEntry, type TenantSessionSummary } from '../../services/SessionAuditService';
import { PAGE_SIZE } from '../../constants/pagination';

export const SessionsPage: React.FC = () => {
  const [groups, setGroups] = useState<TenantSessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailByTenant, setDetailByTenant] = useState<Record<string, SessionEntry[]>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      SessionAuditService.getTenantSessionSummary(page, PAGE_SIZE, 30)
        .then(({ tenants, total }) => {
          setGroups(tenants);
          setTotal(total);
        })
        .catch(err => console.error('Error loading sessions:', err))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [page]);

  const toggleExpand = (tenantId: string) => {
    if (expandedId === tenantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(tenantId);
    if (!detailByTenant[tenantId]) {
      setDetailLoading(tenantId);
      SessionAuditService.getSessionsForTenant(tenantId, 30)
        .then(sesiones => setDetailByTenant(prev => ({ ...prev, [tenantId]: sesiones })))
        .catch(err => console.error('Error loading tenant sessions:', err))
        .finally(() => setDetailLoading(null));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sesiones"
        subtitle="Últimos 30 días — revisión manual, no bloquea a nadie automáticamente"
      />

      <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <div className="p-4 sm:p-6 border-b border-surface-100 flex items-center gap-3 dark:border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0 dark:bg-gray-800 dark:text-gray-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-surface-900 dark:text-gray-100">Sesiones por taller</h2>
            <p className="text-xs text-surface-500 dark:text-gray-400">
              Más IPs distintas que usuarios activos sugiere credenciales compartidas entre sucursales
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-surface-500 dark:text-gray-400">Cargando...</div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert className="w-5 h-5" />}
            title="Sin sesiones registradas"
            description="Todavía no hay logins de talleres en los últimos 30 días."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800">
                  <th className="px-4 md:px-6 py-3 w-8"></th>
                  <th className="px-4 md:px-6 py-3">Taller</th>
                  <th className="px-4 md:px-6 py-3 text-right">Usuarios activos</th>
                  <th className="px-4 md:px-6 py-3 text-right">Sesiones</th>
                  <th className="px-4 md:px-6 py-3 text-right">IPs distintas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                {groups.map(g => {
                  const isExpanded = expandedId === g.tenantId;
                  const sospechoso = g.ipsDistintas > g.usuariosDistintos;
                  const detalle = detailByTenant[g.tenantId];
                  return (
                    <React.Fragment key={g.tenantId}>
                      <tr
                        onClick={() => toggleExpand(g.tenantId)}
                        className="cursor-pointer hover:bg-surface-50 transition-colors duration-150 dark:hover:bg-gray-800/60"
                      >
                        <td className="px-4 md:px-6 py-3.5 text-surface-400 dark:text-gray-500">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-sm font-medium text-surface-900 dark:text-gray-100">
                          {g.tenantNombre}
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-sm text-surface-600 text-right dark:text-gray-400">
                          {g.usuariosDistintos}
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-sm text-surface-600 text-right dark:text-gray-400">
                          {g.totalSesiones}
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-right">
                          <Badge variant={sospechoso ? 'warning' : 'default'}>{g.ipsDistintas}</Badge>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-4 md:px-6 py-4 bg-surface-50 dark:bg-gray-900/60">
                            {detailLoading === g.tenantId ? (
                              <div className="py-6 text-center text-sm text-surface-500 dark:text-gray-400">Cargando...</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[520px]">
                                  <thead>
                                    <tr className="text-xs font-medium text-surface-500 dark:text-gray-400">
                                      <th className="pr-4 py-2">Usuario</th>
                                      <th className="pr-4 py-2">IP</th>
                                      <th className="pr-4 py-2">Dispositivo</th>
                                      <th className="py-2">Fecha</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-surface-200 dark:divide-gray-800">
                                    {(detalle || []).map((s, idx) => (
                                      <tr key={`${s.usuarioId}-${s.createdAt}-${idx}`}>
                                        <td className="pr-4 py-2 text-sm text-surface-900 dark:text-gray-100">
                                          {s.usuarioNombre || s.usuarioEmail}
                                        </td>
                                        <td className="pr-4 py-2 text-sm font-mono text-surface-600 dark:text-gray-400">
                                          {s.ip || '—'}
                                        </td>
                                        <td className="pr-4 py-2 text-xs text-surface-500 truncate max-w-[240px] dark:text-gray-500">
                                          {s.userAgent || '—'}
                                        </td>
                                        <td className="py-2 text-sm text-surface-600 dark:text-gray-400">
                                          {new Date(s.createdAt).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
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
    </div>
  );
};
