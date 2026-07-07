import { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

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
      // Validaciones
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
    <div className="fixed inset-0 bg-gray-900/40 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo cliente</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Nombre Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Empresa *
            </label>
            <input
              type="text"
              value={formData.nombre_empresa}
              onChange={handleNameChange}
              placeholder="ej: Julio Celulares"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL) *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="ej: julio-celulares"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 outline-none text-sm"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Solo letras, números y guiones</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="info@julio.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          {/* RUC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUC (Opcional)
            </label>
            <input
              type="text"
              value={formData.ruc}
              onChange={(e) => setFormData((prev) => ({ ...prev, ruc: e.target.value }))}
              placeholder="ej: 123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (Opcional)
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
              placeholder="+595981234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección (Opcional)
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData((prev) => ({ ...prev, direccion: e.target.value }))}
              placeholder="Calle Principal 123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 outline-none"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 h-11 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors duration-150 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 h-11 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
