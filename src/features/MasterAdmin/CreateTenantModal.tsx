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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Cliente</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
