import { useState } from 'react';
import { Building2, AlertCircle, Loader2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';
import type { Tenant } from '../../services/SaaSAuthService';

const PLAN_OPTIONS = ['basic', 'professional', 'enterprise'] as const;

interface EditTenantModalProps {
  tenant: Tenant;
  onClose: () => void;
  onSave: (updates: {
    nombre_empresa: string;
    slug: string;
    email: string;
    ruc?: string;
    telefono?: string;
    direccion?: string;
    plan: string;
  }) => Promise<void>;
}

export const EditTenantModal = ({ tenant, onClose, onSave }: EditTenantModalProps) => {
  const [formData, setFormData] = useState({
    nombre_empresa: tenant.nombre_empresa,
    slug: tenant.slug,
    email: tenant.email,
    ruc: tenant.ruc || '',
    telefono: tenant.telefono || '',
    direccion: tenant.direccion || '',
    plan: tenant.plan,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.nombre_empresa.trim()) {
        throw new Error('El nombre de empresa es requerido');
      }
      if (!formData.slug.trim().match(/^[a-z0-9-]+$/)) {
        throw new Error('El slug solo puede contener letras minúsculas, números y guiones');
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        throw new Error('Email válido es requerido');
      }

      await onSave({
        nombre_empresa: formData.nombre_empresa.trim(),
        slug: formData.slug.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        ruc: formData.ruc?.trim() || undefined,
        telefono: formData.telefono?.trim() || undefined,
        direccion: formData.direccion?.trim() || undefined,
        plan: formData.plan,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalHeader
        title="Editar taller"
        subtitle={tenant.nombre_empresa}
        icon={<Building2 className="w-5 h-5" />}
        onClose={onClose}
        closeDisabled={loading}
      />

      <form onSubmit={handleSubmit} className="contents">
        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg flex gap-3 dark:bg-red-950/30 dark:border-red-900">
              <AlertCircle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5 dark:text-red-400" />
              <p className="text-danger-700 text-sm dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Nombre de empresa *</label>
            <input
              type="text"
              value={formData.nombre_empresa}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre_empresa: e.target.value }))}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Slug (URL) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              disabled={loading}
            />
            <p className="text-xs text-surface-500 mt-1 dark:text-gray-400">Solo letras, números y guiones</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Plan *</label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData((prev) => ({ ...prev, plan: e.target.value }))}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none capitalize dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              disabled={loading}
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p} className="capitalize dark:bg-gray-800 dark:text-gray-100">{p}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">RUC</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData((prev) => ({ ...prev, ruc: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 dark:text-gray-300">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              disabled={loading}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 text-sm font-medium text-surface-700 bg-white border border-surface-300 hover:bg-surface-50 rounded-lg transition-colors duration-150 disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-medium bg-surface-900 hover:bg-surface-800 text-white rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
