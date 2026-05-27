import { useState, useEffect } from 'react';
import { useTenants } from '../../hooks/useAuthSaaS';
import { useAuth } from '../../hooks/useAuthSaaS';
import { Plus, LogOut, Trash2, Edit2 } from 'lucide-react';
import { CreateTenantModal } from './CreateTenantModal';
import type { Tenant } from '../../services/SaaSAuthService';

export const MasterAdminDashboard = () => {
  const { user, logout } = useAuth();
  const { tenants, loading, createTenant, deactivateTenant } = useTenants();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Validar que sea master admin
  useEffect(() => {
    if (user && !user.is_master) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('¿Desactivar este tenant? Sus usuarios no podrán ingresar.')) {
      return;
    }
    try {
      await deactivateTenant(tenantId);
    } catch (error) {
      alert('Error al desactivar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleCreateTenant = async (data: any) => {
    try {
      await createTenant(data);
      setShowCreateModal(false);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FixFlow Admin</h1>
            <p className="text-sm text-gray-600 mt-1">Gestión de Clientes (Tenants)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">Master Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tus Clientes</h2>
            <p className="text-gray-600 text-sm mt-1">Administra las empresas que usan FixFlow</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Tenants Grid */}
        {!loading && tenants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition p-6"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{tenant.nombre_empresa}</h3>
                    <p className="text-sm text-gray-500 mt-1">{tenant.slug}</p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      tenant.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tenant.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm mb-4">
                  {tenant.email && (
                    <div>
                      <p className="text-gray-600">Email: {tenant.email}</p>
                    </div>
                  )}
                  {tenant.ruc && (
                    <div>
                      <p className="text-gray-600">RUC: {tenant.ruc}</p>
                    </div>
                  )}
                  {tenant.telefono && (
                    <div>
                      <p className="text-gray-600">Teléfono: {tenant.telefono}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Plan: <span className="font-semibold">{tenant.plan}</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedTenant(tenant)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Ver Usuarios
                  </button>
                  {tenant.activo && (
                    <button
                      onClick={() => handleDeleteTenant(tenant.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded transition"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-lg mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes aún</h3>
            <p className="text-gray-600 mb-6">Crea tu primer cliente para empezar</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Crear Cliente
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{selectedTenant.nombre_empresa}</h2>
            <p className="text-gray-600 mb-4">Vista de usuarios - próximamente</p>
            <button
              onClick={() => setSelectedTenant(null)}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
