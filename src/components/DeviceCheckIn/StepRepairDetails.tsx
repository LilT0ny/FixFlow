import React, { useState } from 'react';
import { Wrench, Camera, X, DollarSign } from 'lucide-react';
import type { RepairDetails } from '../../types';

interface StepRepairDetailsProps {
  data: RepairDetails;
  onChange: (data: RepairDetails) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const StepRepairDetails: React.FC<StepRepairDetailsProps> = ({ data, onChange, onSubmit, onBack }) => {
  const [photos, setPhotos] = useState<string[]>(data.evidencePhotos || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (photos.length >= 3) return;
    
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newPhotos = [...photos, base64String];
        setPhotos(newPhotos);
        onChange({ ...data, evidencePhotos: newPhotos });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onChange({ ...data, evidencePhotos: newPhotos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Falla Reportada por el Cliente</label>
          <div className="relative">
             <div className="absolute top-3 left-3 pointer-events-none">
                <Wrench className="h-5 w-5 text-gray-400" />
             </div>
             <textarea
              required
              rows={3}
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Ej. LA PANTALLA NO ENCIENDE, NO CARGA..."
              value={data.reportedIssue}
              onChange={(e) => onChange({ ...data, reportedIssue: e.target.value.toUpperCase() })}
             />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abono Inicial (Opcional)</label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
             </div>
             <input
              type="number"
              min="0"
              step="0.01"
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors"
              placeholder="Ej. 10.00"
              value={data.initialDeposit === undefined ? '' : data.initialDeposit}
              onChange={(e) => onChange({ ...data, initialDeposit: e.target.value === '' ? '' : parseFloat(e.target.value) })}
             />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fotos de Evidencia (Máx. 3)</label>
          
          <div className="flex flex-wrap gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative inline-block">
                <img src={photo} alt={`Evidencia ${index + 1}`} className="h-32 w-32 object-cover rounded-xl border-2 border-gray-200 shadow-sm" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  title="Quitar foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {photos.length < 3 && (
              <div className="flex-1 min-w-[140px] flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl overflow-hidden hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50 cursor-pointer">
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Subir foto</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 pt-1">{3 - photos.length} restante(s)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="bg-white border text-gray-700 px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all active:scale-95"
        >
          Atrás
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Guardar e Imprimir
        </button>
      </div>
    </form>
  );
};
