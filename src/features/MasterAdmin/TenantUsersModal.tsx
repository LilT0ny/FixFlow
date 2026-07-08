import { useState, useEffect } from 'react';
import { UserPlus, User, Shield, Wrench, Power, PowerOff, Loader2, CheckCircle } from 'lucide-react';
import { useTenantUsers } from './useTenantUsers';
import type { Tenant } from '../../services/SaaSAuthService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';
import { GeneratedPasswordField } from '../../components/molecules/GeneratedPasswordField';
import { generateTempPassword } from '../../utils/generatePassword';

interface Props {
  tenant: Tenant;
  onClose: () => void;
}

const ROLE_LABELS = {
  owner: { label: 'Dueño del taller', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  member: { label: 'Miembro', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
};

export const TenantUsersModal = ({ tenant, onClose }: Props) => {
  const { users, loading, error, fetchUsers, createUser, deactivateUser, activateUser } = useTenantUsers(tenant.id);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', nombre: '', password: generateTempPassword(), role: 'owner' as 'owner' | 'member' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await createUser(formData);
      setCreatedUser({ email: formData.email, password: formData.password });
      setFormData({ email: '', nombre: '', password: generateTempPassword(), role: 'owner' });
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
    <Modal isOpen onClose={onClose} size="lg">
      <ModalHeader
        title={tenant.nombre_empresa}
        subtitle="Usuarios del taller"
        onClose={onClose}
      />

      <ModalBody>
        {error && (
          <div className="mb-4 p-3 bg-danger-50 border border-danger-100 rounded-lg text-danger-700 text-sm">{error}</div>
        )}

        {createdUser && (
          <div className="mb-4 p-4 bg-success-50 border border-success-100 rounded-xl space-y-3 animate-scale-in">
            <p className="text-success-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {`"${createdUser.email}" fue creado correctamente`}
            </p>
            <GeneratedPasswordField password={createdUser.password} />
            <p className="text-xs text-surface-500">Copiá esta contraseña ahora — no se va a volver a mostrar.</p>
            <button
              type="button"
              onClick={() => setCreatedUser(null)}
              className="text-xs font-medium text-surface-600 hover:text-surface-900 transition-colors duration-150"
            >
              Cerrar aviso
            </button>
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-surface-50 rounded-xl border border-surface-200">
            <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Nuevo usuario
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Correo</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="ej: dueno@tallercentral.com"
                  required
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="ej: Carlos Gómez"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <GeneratedPasswordField
                password={formData.password}
                onRegenerate={() => setFormData(p => ({ ...p, password: generateTempPassword() }))}
              />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value as typeof formData.role }))}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="owner">Dueño del taller</option>
                  <option value="member">Miembro</option>
                </select>
              </div>
              {formError && (
                <p className="text-danger-600 text-sm">{formError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-surface-900 hover:bg-surface-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors duration-150"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Crear usuario
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="px-4 py-2 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 rounded-lg text-sm font-medium transition-colors duration-150"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => { setShowForm(true); setCreatedUser(null); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-surface-300 hover:border-surface-400 hover:bg-surface-50 text-surface-600 hover:text-surface-900 rounded-lg transition-colors duration-150 mb-4 text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Agregar usuario al taller
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-surface-400">
            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay usuarios aún</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {users.map(u => {
              const roleConfig = ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || ROLE_LABELS.member;
              const RoleIcon = roleConfig.icon;
              return (
                <li
                  key={u.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    u.activo ? 'bg-white border-surface-200' : 'bg-surface-50 border-surface-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${roleConfig.color}`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate">{u.nombre || u.email}</p>
                      <p className="text-xs text-surface-500">{roleConfig.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleUser(u.id, u.activo)}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                    className={`p-2 rounded-lg transition shrink-0 ${
                      u.activo
                        ? 'text-danger-400 hover:bg-danger-50 hover:text-danger-600'
                        : 'text-success-500 hover:bg-success-50 hover:text-success-700'
                    }`}
                  >
                    {u.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="w-full h-11 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 rounded-lg text-sm font-medium transition-colors duration-150"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  );
};
