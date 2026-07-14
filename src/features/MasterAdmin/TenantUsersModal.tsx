import { useState, useEffect } from 'react';
import { UserPlus, User, Shield, Wrench, Power, PowerOff, Loader2, CheckCircle, Pencil, Trash2, Check } from 'lucide-react';
import { useTenantUsers, type TenantUser } from './useTenantUsers';
import type { Tenant } from '../../services/SaaSAuthService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';
import { GeneratedPasswordField } from '../../components/molecules/GeneratedPasswordField';
import { generateTempPassword } from '../../utils/generatePassword';
import { useToast } from '../../store/ToastContext';

interface Props {
  tenant: Tenant;
  onClose: () => void;
}

const ROLE_LABELS = {
  owner: { label: 'Dueño del taller', icon: Shield, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40' },
  member: { label: 'Miembro', icon: Wrench, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40' },
};

export const TenantUsersModal = ({ tenant, onClose }: Props) => {
  const { users, loading, error, fetchUsers, createUser, deactivateUser, activateUser, updateUser, deleteUser } = useTenantUsers(tenant.id);
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', nombre: '', password: generateTempPassword(), role: 'owner' as 'owner' | 'member' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', nombre: '', role: 'member' as 'owner' | 'member' });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

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
        showToast('Usuario desactivado', 'success');
      } else {
        await activateUser(userId);
        showToast('Usuario activado', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error desconocido', 'error');
    }
  };

  const startEdit = (u: TenantUser) => {
    setEditingId(u.id);
    setEditError('');
    setEditForm({ email: u.email, nombre: u.nombre || '', role: (u.role as 'owner' | 'member') || 'member' });
  };

  const handleSaveEdit = async (userId: string) => {
    setEditError('');
    setEditSubmitting(true);
    try {
      await updateUser(userId, { email: editForm.email, nombre: editForm.nombre, role: editForm.role });
      setEditingId(null);
      showToast('Usuario actualizado', 'success');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error editando usuario');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, label: string) => {
    if (!confirm(`¿Eliminar a "${label}" definitivamente? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser(userId);
      showToast('Usuario eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error desconocido', 'error');
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
          <div className="mb-4 p-4 bg-success-50 border border-success-100 rounded-xl space-y-3 animate-scale-in dark:bg-emerald-950/20 dark:border-emerald-900">
            <p className="text-success-700 text-sm font-medium flex items-center gap-2 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {`"${createdUser.email}" fue creado correctamente`}
            </p>
            <GeneratedPasswordField password={createdUser.password} />
            <p className="text-xs text-surface-500 dark:text-gray-400">Copiá esta contraseña ahora — no se va a volver a mostrar.</p>
            <button
              type="button"
              onClick={() => setCreatedUser(null)}
              className="text-xs font-medium text-surface-600 hover:text-surface-900 transition-colors duration-150 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Cerrar aviso
            </button>
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-surface-50 rounded-xl border border-surface-200 dark:bg-gray-900/60 dark:border-gray-800">
            <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2 text-sm dark:text-gray-200">
              <UserPlus className="w-4 h-4" /> Nuevo usuario
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Correo</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="ej: dueno@tallercentral.com"
                  required
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="ej: Carlos Gómez"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <GeneratedPasswordField
                password={formData.password}
                onRegenerate={() => setFormData(p => ({ ...p, password: generateTempPassword() }))}
              />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Rol</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value as typeof formData.role }))}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                  <option value="owner">Dueño del taller</option>
                  <option value="member">Miembro</option>
                </select>
              </div>
              {formError && (
                <p className="text-danger-600 text-sm dark:text-red-400">{formError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-surface-900 hover:bg-surface-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors duration-150 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Crear usuario
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="px-4 py-2 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 rounded-lg text-sm font-medium transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => { setShowForm(true); setCreatedUser(null); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-surface-300 hover:border-surface-400 hover:bg-surface-50 text-surface-600 hover:text-surface-900 rounded-lg transition-colors duration-150 mb-4 text-sm font-medium dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
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
          <div className="text-center py-8 text-surface-400 dark:text-gray-600">
            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay usuarios aún</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {users.map(u => {
              const roleConfig = ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || ROLE_LABELS.member;
              const RoleIcon = roleConfig.icon;

              if (editingId === u.id) {
                return (
                  <li key={u.id} className="p-3 rounded-xl border border-primary-200 bg-primary-50/40 space-y-2.5 dark:border-blue-900 dark:bg-blue-950/20">
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Correo"
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                    <input
                      type="text"
                      value={editForm.nombre}
                      onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Nombre"
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    />
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm(p => ({ ...p, role: e.target.value as 'owner' | 'member' }))}
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    >
                      <option value="owner">Dueño del taller</option>
                      <option value="member">Miembro</option>
                    </select>
                    {editError && <p className="text-danger-600 text-xs dark:text-red-400">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(u.id)}
                        disabled={editSubmitting}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-900 hover:bg-surface-800 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors duration-150 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                      >
                        {editSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 rounded-lg text-xs font-medium transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={u.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    u.activo ? 'bg-white border-surface-200 dark:bg-gray-900 dark:border-gray-800' : 'bg-surface-50 border-surface-100 opacity-60 dark:bg-gray-900/40 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${roleConfig.color}`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate dark:text-gray-100">{u.nombre || u.email}</p>
                      <p className="text-xs text-surface-500 dark:text-gray-400">{roleConfig.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(u)}
                      title="Editar"
                      className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors duration-150 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleUser(u.id, u.activo)}
                      title={u.activo ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition-colors duration-150 ${
                        u.activo
                          ? 'text-warning-500 hover:bg-warning-50 hover:text-warning-600 dark:text-amber-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-300'
                          : 'text-success-500 hover:bg-success-50 hover:text-success-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                      }`}
                    >
                      {u.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.nombre || u.email)}
                      title="Eliminar definitivamente"
                      className="p-2 rounded-lg text-danger-400 hover:bg-danger-50 hover:text-danger-600 transition-colors duration-150 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="w-full h-11 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 rounded-lg text-sm font-medium transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  );
};
