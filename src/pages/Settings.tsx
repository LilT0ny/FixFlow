import React, { useState } from 'react';
import { Printer, MessageSquare, Building2, ImageIcon, Save, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../store/SettingsContext';
import type { BusinessSettings, PrinterType } from '../store/SettingsContext';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';

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
          <p className="text-gray-500">Configura los detalles de tu negocio y parámetros del sistema.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saveStatus !== 'idle'}
          className={`px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all duration-300 ${
            saveStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" />
              ¡Guardado con éxito!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Pop-up de confirmación (Toast) */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Configuración Actualizada</p>
              <p className="text-xs text-surface-400">Los cambios se aplicaron correctamente.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <Building2 className="w-5 h-5 text-gray-400" />
            <h2 className="font-bold text-gray-800">Informacion de la Empresa</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Legal de la Empresa</label>
              <Input 
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value.toUpperCase() })}
                title="Nombre legal de la empresa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC / Identificación Fiscal</label>
              <Input 
                value={formData.ruc || ''}
                onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                title="RUC o Identificación fiscal"
                placeholder="Ej. 1712345678001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
              <Input 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                title="Teléfono de contacto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de la Empresa</label>
              <Input 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
              <div className="flex items-center gap-4 border border-dashed border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
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
                    className="cursor-pointer inline-flex px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Logo
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Recomendado: PNG o SVG con fondo transparente.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <Printer className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-800">Configuracion de Impresion</h2>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Impresora Térmica Predeterminada</label>
              <div className="grid grid-cols-3 gap-3">
                {(['58mm', '80mm', 'A4'] as PrinterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, printerType: type })}
                    className={`px-4 py-3 border rounded-xl text-center transition-all ${
                      formData.printerType === type 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic mt-2">
                Esta configuración afecta el ancho de los recibos térmicos generados.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-800">Plantilla de Notificación de WhatsApp</h2>
            </div>
            <div className="space-y-4">
              <div>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                  value={formData.whatsappTemplate}
                  onChange={e => setFormData({ ...formData, whatsappTemplate: e.target.value })}
                  placeholder="Enter WhatsApp message template"
                  title="WhatsApp Notification Template"
                />
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs text-amber-800 font-medium mb-1">Marcadores disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{customer}}', '{{device}}', '{{model}}', '{{status}}', '{{orderNumber}}', '{{total}}', '{{abono}}', '{{saldo}}'].map(tag => (
                    <code key={tag} className="bg-white px-2 py-0.5 rounded border border-amber-200 text-xs font-mono text-amber-700 select-all">
                      {tag}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
