import React, { useState, useEffect } from 'react';
import { Printer, MessageSquare, FileText, Info, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import type { PrinterType } from '../../../types';

export const PrintingTab: React.FC = () => {
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
        printerType: formData.printerType,
        whatsappTemplate: formData.whatsappTemplate,
        termsConditions: formData.termsConditions,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving printing/messaging settings:', error);
      setSaveStatus('idle');
      alert('No se pudo guardar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-xl border border-surface-200 p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
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
                  type="button"
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

        <div className="bg-white rounded-xl border border-surface-200 p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
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

        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0">
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
            />
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
