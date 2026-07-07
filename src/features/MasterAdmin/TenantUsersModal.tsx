import { useState, useEffect } from 'react';
import { UserPlus, X, User, Shield, Wrench, Power, PowerOff, Loader2 } from 'lucide-react';
import { useTenantUsers } from './useTenantUsers';
import type { Tenant } from '../../services/SaaSAuthService';

interface Props {
  tenant: Tenant;
  onClose: () => void;
}

const ROLE_LABELS = {
  admin: { label: 'Administrador', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  user: { label: 'Usuario', icon: User, color: 'text-gray-600 bg-gray-50' },
  technician: { label: 'Técnico', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
};

export const TenantUsersModal = ({ tenant, onClose }: Props) => {
  const { users, loading, error, fetchUsers, createUser, deactivateUser, activateUser } = useTenantUsers(tenant.id);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'admin' as 'admin' | 'user' | 'technician' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await createUser(formData);
      setFormData({ username: '', password: '', role: 'admin' });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error creando usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUser = async (userId: string, activo: boolean) => {
    try {
      if (activo) {
        await deactivateUser(userId);
      } else {
        await activateUser(userId);
      }
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tenant.nombre_empresa}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Usuarios del taller</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Create form */}
          {showForm ? (
            <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Nuevo usuario
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                    placeholder="ej: taller_central"
                    required minLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    required minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData(p => ({ ...p, role: e.target.value as typeof formData.role }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Administrador</option>
                    <option value="technician">Técnico</option>
                    <option value="user">Usuario</option>
                  </select>
                </div>
                {formError && (
                  <p className="text-red-600 text-sm">{formError}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors duration-150"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Crear usuario
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(''); }}
                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-lg transition-colors duration-150 mb-4 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Agregar usuario al taller
            </button>
          )}

          {/* Users list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay usuarios aún</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {users.map(u => {
                const roleConfig = ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || ROLE_LABELS.user;
                const RoleIcon = roleConfig.icon;
                return (
                  <li
                    key={u.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      u.activo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleConfig.color}`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.username}</p>
                        <p className="text-xs text-gray-500">{roleConfig.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleUser(u.id, u.activo)}
                      title={u.activo ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition ${
                        u.activo
                          ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
                          : 'text-green-500 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      {u.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-150"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
