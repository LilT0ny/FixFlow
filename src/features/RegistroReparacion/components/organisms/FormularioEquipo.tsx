import React from 'react';
import { Laptop, PenTool as Tool, QrCode } from 'lucide-react';
import type { DeviceData } from '../../../../types';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';

interface FormularioEquipoProps {
  equipoInfo: DeviceData;
  alActualizar: (datos: DeviceData) => void;
  alAvanzar: () => void;
  alRetroceder: () => void;
}

/**
 * Organismo para capturar los datos del equipo a reparar.
 */
export const FormularioEquipo: React.FC<FormularioEquipoProps> = ({ equipoInfo, alActualizar, alAvanzar, alRetroceder }) => {
  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    alAvanzar();
  };

  const tiposDispositivos = [
    { id: 'celular', label: 'Celular' },
    { id: 'impresora', label: 'Impresora' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'laptop', label: 'Laptop' },
    { id: 'otro', label: 'Otro' },
  ];

  return (
    <form onSubmit={manejarEnvio} className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Tipo de Equipo</label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              <Laptop className="h-5 w-5 text-surface-400" />
            </div>
            <select
              required
              className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow appearance-none"
              value={equipoInfo.deviceType}
              onChange={(e) => alActualizar({ ...equipoInfo, deviceType: e.target.value as DeviceData['deviceType'] })}
            >
              <option value="" disabled>Seleccione un tipo de equipo...</option>
              {tiposDispositivos.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Marca <span className="text-danger-500">*</span></label>
            <Input
              type="text"
              required
              className="uppercase"
              placeholder="Ej. SAMSUNG, HP"
              value={equipoInfo.brand}
              onChange={(e) => alActualizar({ ...equipoInfo, brand: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Modelo <span className="text-danger-500">*</span></label>
            <Input
              type="text"
              required
              className="uppercase"
              placeholder="Ej. GALAXY S23, L3150"
              value={equipoInfo.model}
              onChange={(e) => alActualizar({ ...equipoInfo, model: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">IMEI/Serial <span className="text-danger-500">*</span></label>
          <Input
            type="text"
            required
            maxLength={15}
            icon={<QrCode className="h-5 w-5 text-surface-400" />}
            className="uppercase"
            placeholder="Número de serie o IMEI (15 dígitos)"
            value={equipoInfo.serialNumber}
            onChange={(e) => {
              const soloNumeros = e.target.value.replace(/\D/g, '').substring(0, 15);
              alActualizar({ ...equipoInfo, serialNumber: soloNumeros });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Estado Físico (Descripción)</label>
          <div className="relative">
             <div className="absolute top-3 left-3 pointer-events-none text-surface-400">
                <Tool className="h-5 w-5" />
             </div>
             <textarea
              required
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow uppercase"
              placeholder="Rayones, roturas, enciende o no..."
              value={equipoInfo.physicalCondition}
              onChange={(e) => alActualizar({ ...equipoInfo, physicalCondition: e.target.value.toUpperCase() })}
             />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" onClick={alRetroceder} variant="outline">
          Atrás
        </Button>
        <Button type="submit" variant="primary" disabled={!equipoInfo.deviceType}>
          Siguiente
        </Button>
      </div>
    </form>
  );
};
