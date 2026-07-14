import { useState, useEffect } from 'react';
import { Plus, Shield, Wrench, Power, PowerOff, Loader2, User, ShieldCheck, Trash2, Pencil, Check } from 'lucide-react';
import { useTenantMembers, type TenantMember } from '../hooks/useTenantMembers';
import { CreateUserModal } from './CreateUserModal';
import { MemberPermissionsModal } from './MemberPermissionsModal';
import { useToast } from '../../../store/ToastContext';

const ROLE_LABELS: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  master: { label: 'Master Admin', icon: Shield, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40' },
  owner: { label: 'Dueño del taller', icon: Shield, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40' },
  member: { label: 'Miembro', icon: Wrench, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40' },
};

export const UsersTab = () => {
  const { members, loading, error, fetchMembers, toggleActive, deleteMember, updateMember } = useTenantMembers();
  const { showToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [permissionsFor, setPermissionsFor] = useState<TenantMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', nombre: '' });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleToggle = async (userId: string, activo: boolean) => {
    try {
      await toggleActive(userId, activo);
      showToast(activo ? 'Usuario desactivado' : 'Usuario activado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error desconocido', 'error');
    }
  };

  const handleDelete = async (member: TenantMember) => {
    if (!confirm(`¿Eliminar a "${member.nombre || member.email}" definitivamente? Esta acción no se puede deshacer.`)) return;
    setDeletingId(member.id);
    try {
      await deleteMember(member.id);
      showToast('Usuario eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar el usuario', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (m: TenantMember) => {
    setEditingId(m.id);
    setEditError('');
    setEditForm({ email: m.email, nombre: m.nombre || '' });
  };

  const handleSaveEdit = async (userId: string) => {
    setEditError('');
    setEditSubmitting(true);
    try {
      await updateMember(userId, editForm);
      setEditingId(null);
      showToast('Usuario actualizado', 'success');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error editando usuario');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-xs p-4 sm:p-6 space-y-5 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-4 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-gray-100">Miembros del taller</h2>
          <p className="text-xs text-surface-500 mt-0.5 dark:text-gray-400">
            {loading ? 'Cargando...' : `${members.length} usuario${members.length === 1 ? '' : 's'} con acceso`}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-surface-900 text-white hover:bg-surface-800 transition-colors duration-150 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-danger-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-10 text-surface-400 dark:text-gray-600">
          <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay usuarios aún</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map(m => {
            const roleConfig = ROLE_LABELS[m.role] || ROLE_LABELS.member;
            const RoleIcon = roleConfig.icon;

            if (editingId === m.id) {
              return (
                <li key={m.id} className="p-3 rounded-xl border border-primary-200 bg-primary-50/40 space-y-2.5 dark:border-blue-900 dark:bg-blue-950/20">
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
                  {editError && <p className="text-danger-600 text-xs dark:text-red-400">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(m.id)}
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
                key={m.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors duration-150 ${
                  m.activo ? 'bg-white border-surface-200 dark:bg-gray-900 dark:border-gray-800' : 'bg-surface-50 border-surface-100 opacity-60 dark:bg-gray-900/40 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${roleConfig.color}`}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate dark:text-gray-100">{m.nombre || m.email}</p>
                    <p className="text-xs text-surface-500 truncate dark:text-gray-400">{m.email} · {roleConfig.label}</p>
                  </div>
                </div>
                {/* El dueño no se puede desactivar ni restringir a sí mismo desde acá (evita quedar bloqueado del taller) */}
                {m.role !== 'owner' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(m)}
                      title="Editar"
                      className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors duration-150 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPermissionsFor(m)}
                      title="Permisos de vistas"
                      className="p-2 rounded-lg text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150 dark:text-gray-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(m.id, m.activo)}
                      title={m.activo ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition-colors duration-150 ${
                        m.activo
                          ? 'text-danger-400 hover:bg-danger-50 hover:text-danger-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300'
                          : 'text-success-500 hover:bg-success-50 hover:text-success-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                      }`}
                    >
                      {m.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      disabled={deletingId === m.id}
                      title="Eliminar definitivamente"
                      className="p-2 rounded-lg text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors duration-150 disabled:opacity-50 dark:text-gray-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={fetchMembers}
      />

      {permissionsFor && (
        <MemberPermissionsModal
          member={permissionsFor}
          onClose={() => setPermissionsFor(null)}
        />
      )}
    </div>
  );
};
