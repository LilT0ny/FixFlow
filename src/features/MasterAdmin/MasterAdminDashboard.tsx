import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenants } from '../../hooks/useAuthSaaS';
import { useAuth } from '../../hooks/useAuthSaaS';
import { Plus, LogOut, Trash2, Users, Building2, Activity, Mail, Phone, CreditCard, Pencil, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../../store/ToastContext';
import { CreateTenantModal } from './CreateTenantModal';
import { EditTenantModal } from './EditTenantModal';
import { TenantUsersModal } from './TenantUsersModal';
import type { Tenant } from '../../services/SaaSAuthService';

const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  professional: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

export const MasterAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { tenants, loading, createTenant, deactivateTenant, updateTenant } = useTenants();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Validar que sea master admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!user.is_master) {
        navigate('/');
      }
    }
  }, [user, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('¿Desactivar este taller? Sus usuarios no podrán ingresar hasta que lo reactives.')) return;
    try {
      await deactivateTenant(tenantId);
      showToast('Taller desactivado', 'success');
    } catch (error) {
      showToast('Error al desactivar: ' + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
    }
  };

  const handleCreateTenant = async (data: any) => {
    try {
      await createTenant(data);
      setShowCreateModal(false);
      showToast('Taller creado correctamente', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error desconocido', 'error');
    }
  };

  const handleUpdateTenant = async (data: any) => {
    if (!editingTenant) return;
    await updateTenant(editingTenant.id, data);
    setEditingTenant(null);
    showToast('Taller actualizado', 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const activeCount = tenants.filter(t => t.activo).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">FixFlow Admin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Panel de control maestro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.nombre || user?.email}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Master Admin</p>
            </div>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs dark:bg-gray-900 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Talleres activos</p>
            <p className="text-2xl font-semibold tracking-tight text-blue-600 dark:text-blue-400">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs dark:bg-gray-900 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Total clientes</p>
            <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs col-span-2 sm:col-span-1 dark:bg-gray-900 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Estado sistema</p>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-green-600 dark:text-emerald-400">Operativo</p>
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Talleres / Clientes</h2>
            <p className="text-gray-500 text-sm mt-0.5 dark:text-gray-400">Administrá las empresas que usan FixFlow</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-150 text-sm font-medium dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            <Plus className="w-4 h-4" />
            Nuevo taller
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Tenants Grid */}
        {!loading && tenants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant, idx) => (
              <div
                key={tenant.id}
                style={{ animationDelay: `${idx * 40}ms` }}
                className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-sm hover:border-gray-300 transition-all duration-150 overflow-hidden animate-fade-in-up dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
              >
                {/* Card header */}
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center dark:bg-blue-950/40">
                        <span className="text-blue-700 font-semibold text-sm dark:text-blue-400">
                          {tenant.nombre_empresa.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{tenant.nombre_empresa}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono dark:text-gray-500">{tenant.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${
                        tenant.activo ? 'bg-green-50 text-green-700 border-green-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900'
                      }`}>
                        {tenant.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {tenant.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {tenant.email}</p>}
                    {tenant.telefono && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {tenant.telefono}</p>}
                    {tenant.ruc && <p className="flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> RUC: {tenant.ruc}</p>}
                  </div>

                  <div className="mt-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium capitalize ${PLAN_COLORS[tenant.plan] || PLAN_COLORS.basic}`}>
                      Plan {tenant.plan}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-5 pb-4 pt-3 border-t border-gray-100 mt-2 dark:border-gray-800">
                  <button
                    onClick={() => setEditingTenant(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-150 text-xs font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setSelectedTenant(tenant)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-150 text-xs font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Usuarios
                  </button>
                  {tenant.activo && (
                    <button
                      onClick={() => handleDeleteTenant(tenant.id)}
                      className="px-3 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-950/40"
                      title="Desactivar taller"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && tenants.length === 0 && (
          <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-300 p-16 text-center animate-scale-in dark:bg-gray-900/40 dark:border-gray-700">
            <div className="inline-flex w-12 h-12 items-center justify-center bg-gray-100 rounded-full mb-4 dark:bg-gray-800">
              <Building2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1 dark:text-gray-100">No hay talleres aún</h3>
            <p className="text-gray-500 text-sm mb-6 dark:text-gray-400">Creá tu primer cliente para que empiece a usar FixFlow</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-150 font-medium text-sm dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              <Plus className="w-4 h-4" />
              Crear taller
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTenant}
        />
      )}

      {selectedTenant && (
        <TenantUsersModal
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
        />
      )}

      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSave={handleUpdateTenant}
        />
      )}
    </div>
  );
};
