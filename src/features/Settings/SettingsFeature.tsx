import React, { useState, useEffect } from 'react';
import { Printer, MessageSquare, Building2, ImageIcon, Save, CheckCircle2, Loader2, Info, Plus, FileText } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { CreateUserModal } from './components/CreateUserModal';
import { PageHeader } from '../../components/design-system';
import type { BusinessSettings, PrinterType } from '../../types';

export const SettingsFeature: React.FC = () => {
  const { settings, updateSettings, isSettingsLoading } = useSettings();
  const [formData, setFormData] = React.useState<BusinessSettings>(settings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  useEffect(() => {
    if (!isSettingsLoading) {
      setFormData(settings);
    }
  }, [settings, isSettingsLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await updateSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('idle');
      alert('No se pudo guardar la configuración: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Parámetros del negocio y preferencias de la aplicación"
      >
        <button
          onClick={() => setIsCreateUserModalOpen(true)}
          className="px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] bg-white border border-surface-300 text-surface-700 hover:bg-surface-50"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
        <button
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
            saveStatus === 'success' ? 'bg-success-600 text-white' : 'bg-surface-900 text-white hover:bg-surface-800'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </PageHeader>

      {saveStatus === 'success' && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] animate-fade-in-up">
          <div className="bg-surface-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-full shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Configuración actualizada</p>
              <p className="text-xs text-surface-300 mt-0.5">Los cambios se aplicaron correctamente</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500">
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
                title="Nombre legal de la empresa"
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">RUC / Identificación Fiscal</label>
              <input 
                value={formData.ruc || ''}
                onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                title="RUC o Identificación fiscal"
                placeholder="Ej. 1712345678001"
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">Teléfono / WhatsApp</label>
              <input 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                title="Teléfono de contacto"
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">Dirección Matriz</label>
              <input 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">Identidad Visual (Logo)</label>
              <div className="flex items-center gap-4 border border-dashed border-surface-300 p-4 rounded-xl hover:bg-surface-50 transition-colors duration-150">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-surface-200 shrink-0">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-surface-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex px-3 py-2 bg-white border border-surface-300 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors duration-150"
                  >
                    Seleccionar imagen
                  </label>
                  <p className="text-xs text-surface-500 mt-2 leading-snug">Formatos: PNG, JPG, SVG. Recomendado: fondo transparente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-surface-900">Configuración de ticket</h2>
                <p className="text-xs text-surface-500">Hardware de impresión</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-surface-600">Ancho de Papel Predeterminado</label>
              <div className="grid grid-cols-3 gap-3">
                {(['58mm', '80mm', 'A4'] as PrinterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, printerType: type })}
                    className={`px-4 py-2.5 border rounded-lg text-center transition-colors duration-150 text-sm font-medium ${
                      formData.printerType === type
                        ? 'border-surface-900 bg-surface-900 text-white'
                        : 'border-surface-300 text-surface-600 hover:border-surface-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="bg-primary-50/50 p-3.5 rounded-lg flex gap-2.5 border border-primary-100">
                <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm text-surface-600 leading-snug">
                  Esta configuración se aplicará automáticamente a todos los formatos de impresión térmica del sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-surface-900">Mensajería automática</h2>
                <p className="text-xs text-surface-500">Plantillas de WhatsApp</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="block text-xs font-medium text-surface-600">Estructura del Mensaje</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none text-sm leading-relaxed min-h-[160px]"
                  value={formData.whatsappTemplate}
                  onChange={e => setFormData({ ...formData, whatsappTemplate: e.target.value })}
                  placeholder="Escribe el mensaje aquí..."
                  title="WhatsApp Notification Template"
                />
              </div>
              <div className="bg-surface-50 rounded-lg p-3.5 border border-surface-200">
                <p className="text-xs font-medium text-surface-600 mb-2.5">Marcadores dinámicos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{{customer}}', '{{device}}', '{{model}}', '{{status}}', '{{orderNumber}}', '{{total}}', '{{abono}}', '{{saldo}}'].map(tag => (
                    <code key={tag} className="bg-white px-2 py-0.5 rounded border border-surface-200 text-xs font-mono text-surface-700 select-all hover:bg-surface-100 transition-colors duration-150">
                      {tag}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-surface-900">Términos y condiciones</h2>
                <p className="text-xs text-surface-500">Se imprimen al pie del ticket de ingreso</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-surface-600">Texto de términos y condiciones</label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none text-sm leading-relaxed min-h-[140px]"
                value={formData.termsConditions || ''}
                onChange={e => setFormData({ ...formData, termsConditions: e.target.value })}
                placeholder="Ej. El taller no se responsabiliza por equipos no retirados después de 30 días. La garantía cubre únicamente el trabajo realizado..."
                title="Términos y condiciones del servicio"
              />
            </div>
          </div>
         </div>
       </div>

       <CreateUserModal 
         isOpen={isCreateUserModalOpen}
         onClose={() => setIsCreateUserModalOpen(false)}
       />
     </div>
   );
};
