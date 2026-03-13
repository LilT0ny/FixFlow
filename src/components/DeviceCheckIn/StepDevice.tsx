import React from 'react';
import { Smartphone, Laptop, Printer, Watch, PenTool as Tool, QrCode } from 'lucide-react';
import type { DeviceData } from '../../types';

interface StepDeviceProps {
  data: DeviceData;
  onChange: (data: DeviceData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepDevice: React.FC<StepDeviceProps> = ({ data, onChange, onNext, onBack }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const deviceTypes = [
    { id: 'celular', label: 'Celular', icon: Smartphone },
    { id: 'impresora', label: 'Impresora', icon: Printer },
    { id: 'tablet', label: 'Tablet', icon: Laptop }, // Laptop icon acting as tablet here, close enough
    { id: 'laptop', label: 'Laptop', icon: Laptop },
    { id: 'otro', label: 'Otro', icon: Watch },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-5">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Laptop className="h-5 w-5 text-gray-400" />
            </div>
            <select
              required
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors appearance-none bg-white font-medium text-gray-700 disabled:opacity-50"
              value={data.deviceType}
              onChange={(e) => onChange({ ...data, deviceType: e.target.value as DeviceData['deviceType'] })}
            >
              <option value="" disabled>Seleccione un tipo de equipo...</option>
              {deviceTypes.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input
              type="text"
              required
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Ej. SAMSUNG, HP"
              value={data.brand}
              onChange={(e) => onChange({ ...data, brand: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input
              type="text"
              required
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Ej. GALAXY S23, L3150"
              value={data.model}
              onChange={(e) => onChange({ ...data, model: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IMEI / Serial</label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <QrCode className="h-5 w-5 text-gray-400" />
             </div>
            <input
              type="text"
              required
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Número de serie o IMEI"
              value={data.serialNumber}
              onChange={(e) => onChange({ ...data, serialNumber: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado Físico (Descripción)</label>
          <div className="relative">
             <div className="absolute top-3 left-3 pointer-events-none">
                <Tool className="h-5 w-5 text-gray-400" />
             </div>
             <textarea
              required
              rows={3}
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Rayones, roturas, enciende o no..."
              value={data.physicalCondition}
              onChange={(e) => onChange({ ...data, physicalCondition: e.target.value.toUpperCase() })}
             />
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
          disabled={!data.deviceType}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </form>
  );
};
