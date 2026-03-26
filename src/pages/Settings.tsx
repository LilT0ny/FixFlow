import React, { useState } from 'react';
import { Printer, MessageSquare, Building2, ImageIcon, Save, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import type { BusinessSettings, PrinterType } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, isSettingsLoading } = useSettings();
  const [formData, setFormData] = React.useState<BusinessSettings>(settings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  React.useEffect(() => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">
            Ajustes del Sistema
          </h2>
          <p className="text-surface-500 mt-1">Configura los detalles de tu negocio y parámetros del sistema.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saveStatus !== 'idle'}
          className={`px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 ${
            saveStatus === 'success' ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-100'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {/* Pop-up de confirmación (Toast) */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Configuración Actualizada</p>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mt-1">Los cambios se aplicaron correctamente</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[32px] border border-surface-200 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-surface-50 flex items-center justify-center text-surface-400 border border-surface-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-surface-900">Perfil de Empresa</h2>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Datos para Facturación</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Nombre Comercial / Razón Social</label>
              <input 
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value.toUpperCase() })}
                title="Nombre legal de la empresa"
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 text-sm font-bold uppercase focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">RUC / Identificación Fiscal</label>
              <input 
                value={formData.ruc || ''}
                onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                title="RUC o Identificación fiscal"
                placeholder="Ej. 1712345678001"
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Teléfono / WhatsApp</label>
              <input 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                title="Teléfono de contacto"
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Dirección Matriz</label>
              <input 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 text-sm font-bold uppercase focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Identidad Visual (Logo)</label>
              <div className="flex items-center gap-5 border-2 border-dashed border-surface-100 p-5 rounded-[24px] hover:bg-surface-50 transition-colors group">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-surface-200 shadow-sm group-hover:scale-105 transition-transform">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-surface-200" />
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
                    className="cursor-pointer inline-flex px-4 py-2 bg-white border border-surface-200 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-primary-50 hover:text-primary-600 transition-all shadow-sm active:scale-95"
                  >
                    Seleccionar Imagen
                  </label>
                  <p className="text-[10px] text-surface-400 mt-2 leading-tight">Formatos: PNG, JPG, SVG.<br/>Recomendado: Fondo transparente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-surface-200 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-surface-50 flex items-center justify-center text-surface-400 border border-surface-100">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-surface-900">Configuración de Ticket</h2>
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Hardware de Impresión</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Ancho de Papel Predeterminado</label>
              <div className="grid grid-cols-3 gap-3">
                {(['58mm', '80mm', 'A4'] as PrinterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, printerType: type })}
                    className={`px-4 py-3 border rounded-2xl text-center transition-all text-xs font-black uppercase tracking-tighter active:scale-95 ${
                      formData.printerType === type 
                        ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' 
                        : 'border-surface-200 text-surface-500 hover:bg-surface-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="bg-blue-50/50 p-4 rounded-2xl flex gap-3 border border-blue-100">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-tight italic">
                  Esta configuración se aplicará automáticamente a todos los formatos de impresión térmica del sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-surface-200 p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-surface-50 flex items-center justify-center text-surface-400 border border-surface-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-surface-900">Mensajería Automática</h2>
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Plantillas de WhatsApp</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Estructura del Mensaje</label>
                <textarea 
                  className="w-full p-5 bg-surface-50 border border-surface-200 rounded-[24px] focus:ring-4 focus:ring-primary-500/10 outline-none text-sm font-medium leading-relaxed min-h-[160px]"
                  value={formData.whatsappTemplate}
                  onChange={e => setFormData({ ...formData, whatsappTemplate: e.target.value })}
                  placeholder="Escribe el mensaje aquí..."
                  title="WhatsApp Notification Template"
                />
              </div>
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-3">Marcadores Dinámicos:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{customer}}', '{{device}}', '{{model}}', '{{status}}', '{{orderNumber}}', '{{total}}', '{{abono}}', '{{saldo}}'].map(tag => (
                    <code key={tag} className="bg-white px-2.5 py-1 rounded-lg border border-amber-200 text-[10px] font-mono font-bold text-amber-700 select-all hover:bg-amber-100 transition-colors">
                      {tag}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
