import { useState } from 'react';
import { Building2, AlertCircle, Loader2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';

interface CreateTenantModalProps {
  onClose: () => void;
  onCreate: (data: {
    nombre_empresa: string;
    slug: string;
    email: string;
    ruc?: string;
    telefono?: string;
    direccion?: string;
  }) => Promise<void>;
}

export const CreateTenantModal = ({ onClose, onCreate }: CreateTenantModalProps) => {
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    slug: '',
    email: '',
    ruc: '',
    telefono: '',
    direccion: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    const accentMap: Record<string, string> = {
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
    };
    return name
      .toLowerCase()
      .replace(/[áéíóú]/g, (char) => accentMap[char] || char)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      nombre_empresa: name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.nombre_empresa.trim()) {
        throw new Error('El nombre de empresa es requerido');
      }
      if (!formData.slug.trim()) {
        throw new Error('El slug no puede estar vacío');
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        throw new Error('Email válido es requerido');
      }

      await onCreate({
        nombre_empresa: formData.nombre_empresa.trim(),
        slug: formData.slug.trim(),
        email: formData.email.trim(),
        ruc: formData.ruc?.trim() || undefined,
        telefono: formData.telefono?.trim() || undefined,
        direccion: formData.direccion?.trim() || undefined,
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
        title="Nuevo taller"
        subtitle="Alta de cliente del SaaS"
        icon={<Building2 className="w-5 h-5" />}
        onClose={onClose}
        closeDisabled={loading}
      />

      <form onSubmit={handleSubmit} className="contents">
        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Nombre de empresa *</label>
            <input
              type="text"
              value={formData.nombre_empresa}
              onChange={handleNameChange}
              placeholder="ej: Julio Celulares"
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Slug (URL) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="ej: julio-celulares"
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
            <p className="text-xs text-surface-500 mt-1">Solo letras, números y guiones</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="info@julio.com"
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">RUC</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData((prev) => ({ ...prev, ruc: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 text-sm font-medium text-surface-700 bg-white border border-surface-300 hover:bg-surface-50 rounded-lg transition-colors duration-150 disabled:opacity-50"
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
                Creando...
              </>
            ) : (
              'Crear taller'
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
