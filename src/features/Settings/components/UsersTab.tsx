import { useState, useEffect } from 'react';
import { Plus, Shield, Wrench, Power, PowerOff, Loader2, User, ShieldCheck, Trash2 } from 'lucide-react';
import { useTenantMembers, type TenantMember } from '../hooks/useTenantMembers';
import { CreateUserModal } from './CreateUserModal';
import { MemberPermissionsModal } from './MemberPermissionsModal';

const ROLE_LABELS: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  master: { label: 'Master Admin', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  owner: { label: 'Dueño del taller', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  member: { label: 'Miembro', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
};

export const UsersTab = () => {
  const { members, loading, error, fetchMembers, toggleActive, deleteMember } = useTenantMembers();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [permissionsFor, setPermissionsFor] = useState<TenantMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleToggle = async (userId: string, activo: boolean) => {
    try {
      await toggleActive(userId, activo);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleDelete = async (member: TenantMember) => {
    if (!confirm(`¿Eliminar a "${member.nombre || member.email}" definitivamente? Esta acción no se puede deshacer.`)) return;
    setDeletingId(member.id);
    try {
      await deleteMember(member.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el usuario');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-xs p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-surface-900">Miembros del taller</h2>
          <p className="text-xs text-surface-500 mt-0.5">
            {loading ? 'Cargando...' : `${members.length} usuario${members.length === 1 ? '' : 's'} con acceso`}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-surface-900 text-white hover:bg-surface-800 transition-colors duration-150"
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
        <div className="text-center py-10 text-surface-400">
          <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay usuarios aún</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map(m => {
            const roleConfig = ROLE_LABELS[m.role] || ROLE_LABELS.member;
            const RoleIcon = roleConfig.icon;
            return (
              <li
                key={m.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors duration-150 ${
                  m.activo ? 'bg-white border-surface-200' : 'bg-surface-50 border-surface-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${roleConfig.color}`}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{m.nombre || m.email}</p>
                    <p className="text-xs text-surface-500 truncate">{m.email} · {roleConfig.label}</p>
                  </div>
                </div>
                {/* El dueño no se puede desactivar ni restringir a sí mismo desde acá (evita quedar bloqueado del taller) */}
                {m.role !== 'owner' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setPermissionsFor(m)}
                      title="Permisos de vistas"
                      className="p-2 rounded-lg text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(m.id, m.activo)}
                      title={m.activo ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition-colors duration-150 ${
                        m.activo
                          ? 'text-danger-400 hover:bg-danger-50 hover:text-danger-600'
                          : 'text-success-500 hover:bg-success-50 hover:text-success-700'
                      }`}
                    >
                      {m.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      disabled={deletingId === m.id}
                      title="Eliminar definitivamente"
                      className="p-2 rounded-lg text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors duration-150 disabled:opacity-50"
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
