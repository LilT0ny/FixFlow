import React, { useState, useEffect } from 'react';
import { Building2, ImageIcon, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

export const CompanyTab: React.FC = () => {
  const { settings, updateSettings, isSettingsLoading } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    if (!isSettingsLoading) setFormData(settings);
  }, [settings, isSettingsLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await updateSettings({
        companyName: formData.companyName,
        ruc: formData.ruc,
        phone: formData.phone,
        address: formData.address,
        logo: formData.logo,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving company profile:', error);
      setSaveStatus('idle');
      alert('No se pudo guardar el perfil de empresa: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-surface-900">Perfil de empresa</h2>
              <p className="text-xs text-surface-500">Datos para facturación</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">Nombre Comercial / Razón Social</label>
              <input
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-surface-600">RUC / Identificación Fiscal</label>
                <input
                  value={formData.ruc || ''}
                  onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                  placeholder="Ej. 1712345678001"
                  className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-surface-600">Teléfono / WhatsApp</label>
                <input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">Dirección Matriz</label>
              <input
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl border border-surface-200 p-4 sm:p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-sm font-semibold text-surface-900">Identidad visual</h2>
            <p className="text-xs text-surface-500 mt-0.5">Logo del taller</p>
          </div>
          <div className="w-full aspect-square max-w-[180px] mx-auto bg-white rounded-lg flex items-center justify-center overflow-hidden border border-surface-200">
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-3" />
            ) : (
              <ImageIcon className="w-10 h-10 text-surface-300" />
            )}
          </div>
          <div className="text-center">
            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange} />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer inline-flex px-3 py-2 bg-white border border-surface-300 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors duration-150"
            >
              Seleccionar imagen
            </label>
            <p className="text-xs text-surface-500 mt-2 leading-snug">PNG, JPG o SVG. Fondo transparente recomendado.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saveStatus !== 'idle'}
          className={`w-full sm:w-auto px-5 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
            saveStatus === 'success' ? 'bg-success-600 text-white' : 'bg-surface-900 text-white hover:bg-surface-800'
          }`}
        >
          {saveStatus === 'saving' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : saveStatus === 'success' ? (
            <><CheckCircle2 className="w-4 h-4" /> ¡Guardado!</>
          ) : (
            <><Save className="w-4 h-4" /> Guardar cambios</>
          )}
        </button>
      </div>
    </form>
  );
};
