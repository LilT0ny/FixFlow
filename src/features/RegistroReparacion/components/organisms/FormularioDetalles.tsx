import React, { useState } from 'react';
import { Wrench, Camera, X, DollarSign } from 'lucide-react';
import type { RepairDetails, EvidencePhoto } from '../../../../types';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';

interface FormularioDetallesProps {
  detallesInfo: RepairDetails;
  alActualizar: (datos: RepairDetails) => void;
  alCompletar: () => void;
  alRetroceder: () => void;
}

/**
 * Organismo para capturar los detalles de reparación, fotos y costos.
 */
export const FormularioDetalles: React.FC<FormularioDetallesProps> = ({ detallesInfo, alActualizar, alCompletar, alRetroceder }) => {
  const [fotos, setFotos] = useState<EvidencePhoto[]>(detallesInfo.evidencePhotos || []);

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    const abono = detallesInfo.initialDeposit || 0;
    const costo = detallesInfo.repairTotalCost || 0;
    if (abono > costo) {
      alert('El abono no puede ser mayor al costo total de la reparación.');
      return;
    }
    alCompletar();
  };

  const procesarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const cantidadFotos = fotos.filter(p => p.stage === 'antes').length;
    if (cantidadFotos >= 3) return;
    
    const archivo = e.target.files?.[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onloadend = () => {
        const base64String = lector.result as string;
        
        const img = new Image();
        img.src = base64String;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const imagenOptimizada = canvas.toDataURL('image/jpeg', 0.7);

          const nuevaFoto: EvidencePhoto = { stage: 'antes', url: imagenOptimizada };
          const loteFotos = [...fotos, nuevaFoto];
          setFotos(loteFotos);
          alActualizar({ ...detallesInfo, evidencePhotos: loteFotos });
        };
      };
      lector.readAsDataURL(archivo);
    }
  };

  const eliminarFoto = (indice: number) => {
    const loteFotos = fotos.filter((_, i) => i !== indice);
    setFotos(loteFotos);
    alActualizar({ ...detallesInfo, evidencePhotos: loteFotos });
  };

  return (
    <form onSubmit={manejarEnvio} className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Trabajo a realizar / Falla <span className="text-danger-500">*</span></label>
          <div className="relative w-full">
             <div className="absolute top-3 left-3 pointer-events-none text-surface-400">
                <Wrench className="h-5 w-5" />
             </div>
             <textarea
              required
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow uppercase"
              placeholder="Ej. LA PANTALLA NO ENCIENDE, NO CARGA..."
              value={detallesInfo.reportedIssue}
              onChange={(e) => alActualizar({ ...detallesInfo, reportedIssue: e.target.value.toUpperCase() })}
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-surface-700 mb-1">Costo Estimado ($) <span className="text-danger-500">*</span></label>
             <Input
               type="number"
               required
               min="0"
               step="0.01"
               icon={<DollarSign className="w-5 h-5 text-surface-400" />}
               placeholder="Ej. 45.00"
               value={detallesInfo.repairTotalCost ?? ''}
               onChange={(e) => alActualizar({ ...detallesInfo, repairTotalCost: e.target.value === '' ? '' : parseFloat(e.target.value) })}
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-surface-700 mb-1">Abono Inicial ($)</label>
             <Input
               type="number"
               min="0"
               max={detallesInfo.repairTotalCost || undefined}
               step="0.01"
               icon={<DollarSign className="w-5 h-5 text-surface-400" />}
               placeholder="Ej. 10.00"
               value={detallesInfo.initialDeposit ?? ''}
               onChange={(e) => alActualizar({ ...detallesInfo, initialDeposit: e.target.value === '' ? '' : parseFloat(e.target.value) })}
             />
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Fotos de Evidencia Inicial (Máx. 3)</label>
          
          <div className="flex flex-wrap gap-4">
            {fotos.map((foto, index) => (
              <div key={index} className="relative inline-block">
                <img src={foto.url} alt={`Evidencia ${index + 1}`} className="h-32 w-32 object-cover rounded-xl border-2 border-surface-200 shadow-sm" />
                <span className="absolute bottom-1 left-1 bg-surface-900/80 text-white text-[10px] px-2 py-0.5 rounded-md uppercase font-bold">{foto.stage}</span>
                <button
                  type="button"
                  onClick={() => eliminarFoto(index)}
                  className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1 shadow-md hover:bg-danger-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {fotos.filter(p => p.stage === 'antes').length < 3 && (
              <div className="flex-1 min-w-[140px] flex justify-center px-6 pt-5 pb-6 border-2 border-surface-300 border-dashed rounded-xl overflow-hidden hover:border-primary-400 transition-colors bg-surface-50 hover:bg-primary-50 cursor-pointer">
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-surface-400" />
                  <div className="flex text-sm text-surface-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                      <span>Subir foto</span>
                      <input type="file" className="sr-only" onChange={procesarArchivo} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-surface-500 pt-1">{3 - fotos.filter(p => p.stage === 'antes').length} restante(s)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" onClick={alRetroceder} variant="outline">
          Atrás
        </Button>
        <Button type="submit" variant="success">
          Guardar e Imprimir
        </Button>
      </div>
    </form>
  );
};
