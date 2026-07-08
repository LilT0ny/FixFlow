import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/molecules/Modal';
import { PermissionsService } from '../../../services/PermissionsService';
import { ALL_MODULES, MODULE_LABELS, type ModuleKey } from '../../../constants/modules';

interface Props {
  member: { id: string; nombre: string; email: string };
  onClose: () => void;
}

export const MemberPermissionsModal = ({ member, onClose }: Props) => {
  const [selected, setSelected] = useState<Set<ModuleKey>>(new Set(ALL_MODULES));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    PermissionsService.getModules(member.id)
      .then(modules => setSelected(new Set(modules ?? ALL_MODULES)))
      .catch(err => setError(err instanceof Error ? err.message : 'Error cargando permisos'))
      .finally(() => setLoading(false));
  }, [member.id]);

  const toggle = (m: ModuleKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await PermissionsService.setModules(member.id, Array.from(selected));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando permisos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalHeader
        title="Permisos de vistas"
        subtitle={member.nombre || member.email}
        icon={<ShieldCheck className="w-5 h-5" />}
        onClose={onClose}
        closeDisabled={saving}
      />

      <ModalBody className="space-y-4">
        <p className="text-sm text-surface-500">Elegí qué pantallas puede ver este miembro en el menú.</p>

        {error && (
          <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-danger-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {ALL_MODULES.map(m => (
              <label
                key={m}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-150 border ${
                  selected.has(m) ? 'bg-primary-50/50 border-primary-500' : 'bg-surface-50 border-surface-200 hover:border-surface-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary-600"
                  checked={selected.has(m)}
                  onChange={() => toggle(m)}
                />
                <span className="text-sm font-medium text-surface-900">{MODULE_LABELS[m]}</span>
              </label>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex-1 h-11 border border-surface-300 bg-white rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors duration-150 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex-1 h-11 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar permisos'}
        </button>
      </ModalFooter>
    </Modal>
  );
};
