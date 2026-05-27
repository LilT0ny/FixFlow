import React from 'react';
import { Laptop, PenTool as Tool, QrCode } from 'lucide-react';
import type { DeviceData } from '../../../../types';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';

interface DeviceFormProps {
  deviceInfo: DeviceData;
  onUpdate: (data: DeviceData) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Organism to capture the details of the device to be repaired.
 */
export const DeviceForm: React.FC<DeviceFormProps> = ({ deviceInfo, onUpdate, onNext, onBack }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const deviceTypes = [
    { id: 'celular', label: 'Cell Phone' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'laptop', label: 'Laptop' },
    { id: 'impresora', label: 'Printer' },
    { id: 'lavadora', label: 'Washing Machine' },
    { id: 'calefon', label: 'Water Heater (Calefón)' },
    { id: 'refrigerador', label: 'Refrigerator' },
    { id: 'microondas', label: 'Microwave' },
    { id: 'tv', label: 'Television' },
    { id: 'cocina', label: 'Stove/Oven' },
    { id: 'plancha', label: 'Iron' },
    { id: 'licuadora', label: 'Blender' },
    { id: 'otro', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Device Type</label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              <Laptop className="h-5 w-5 text-surface-400" />
            </div>
            <select
              required
              title="Select device type"
              className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow appearance-none"
              value={deviceInfo.deviceType}
              onChange={(e) => onUpdate({ ...deviceInfo, deviceType: e.target.value as DeviceData['deviceType'] })}
            >
              <option value="" disabled>Select device type...</option>
              {deviceTypes.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Brand <span className="text-danger-500">*</span></label>
            <Input
              type="text"
              required
              className="uppercase"
              placeholder="Ex. SAMSUNG, HP"
              value={deviceInfo.brand}
              onChange={(e) => onUpdate({ ...deviceInfo, brand: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Model <span className="text-danger-500">*</span></label>
            <Input
              type="text"
              required
              className="uppercase"
              placeholder="Ex. GALAXY S23, L3150"
              value={deviceInfo.model}
              onChange={(e) => onUpdate({ ...deviceInfo, model: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            {deviceInfo.deviceType === 'celular' ? 'IMEI' : 'Serial Number'} <span className="text-danger-500">*</span>
          </label>
          <Input
            type="text"
            required
            maxLength={deviceInfo.deviceType === 'celular' ? 15 : 30}
            icon={<QrCode className="h-5 w-5 text-surface-400" />}
            className="uppercase"
            placeholder={deviceInfo.deviceType === 'celular' ? 'Serial number or IMEI (15 digits)' : 'Enter serial number...'}
            value={deviceInfo.serialNumber}
            onChange={(e) => {
              const val = deviceInfo.deviceType === 'celular'
                ? e.target.value.replace(/\D/g, '').substring(0, 15)
                : e.target.value.toUpperCase().substring(0, 30);
              onUpdate({ ...deviceInfo, serialNumber: val });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Physical Condition (Description)</label>
          <div className="relative">
             <div className="absolute top-3 left-3 pointer-events-none text-surface-400">
                <Tool className="h-5 w-5" />
             </div>
             <textarea
              required
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow uppercase"
              placeholder="Scratches, cracks, turns on or not..."
              value={deviceInfo.physicalCondition}
              onChange={(e) => onUpdate({ ...deviceInfo, physicalCondition: e.target.value.toUpperCase() })}
             />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button type="submit" variant="primary" disabled={!deviceInfo.deviceType}>
          Next
        </Button>
      </div>
    </form>
  );
};
