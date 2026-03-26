import React from 'react';
import { ClipboardList } from 'lucide-react';
import type { DeviceCheckInForm } from '../../../../types';
import { Button } from '../../../../components/atoms/Button';

interface ModalConfirmacionProps {
  datosCompletos: DeviceCheckInForm;
  estaProcesando: boolean;
  alCerrar: () => void;
  alConfirmar: () => void;
}

export const ModalConfirmacion: React.FC<ModalConfirmacionProps> = ({ 
  datosCompletos, 
  estaProcesando, 
  alCerrar, 
  alConfirmar 
}) => {
  const { customer, device, repair } = datosCompletos;

  return (
    <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-center mb-4">
           <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
             <ClipboardList className="w-8 h-8 text-primary-600" />
           </div>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-center text-surface-900 mb-2">
          ¿Confirmar Ingreso?
        </h3>
        <p className="text-sm text-center text-surface-500 mb-4">
          Revisa los datos antes de registrar el dispositivo en el sistema.
        </p>

        <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 mb-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-500">Cliente:</span>
            <span className="font-bold text-surface-900 text-right">{customer.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-500">Equipo:</span>
            <span className="font-bold text-surface-900 text-right">{device?.brand || 'GENERAL'} {device?.model || ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-500">IMEI/SN:</span>
            <span className="font-bold text-surface-900 text-right">{device?.serialNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-t border-surface-200 pt-2">
            <span className="text-surface-500">Total a Cobrar:</span>
            <span className="font-bold text-primary-600 text-right">${typeof repair.repairTotalCost === 'number' ? repair.repairTotalCost.toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-500">Abono Inicial:</span>
            <span className="font-bold text-success-600 text-right">${typeof repair.initialDeposit === 'number' && repair.initialDeposit > 0 ? repair.initialDeposit.toFixed(2) : '0.00'}</span>
          </div>
        </div>
        </div>
        
        <div className="p-6 pt-4 border-t border-surface-100 bg-white rounded-b-3xl shrink-0">
          <div className="flex gap-3">
            <Button 
              onClick={alCerrar}
              variant="outline"
              className="flex-1"
              disabled={estaProcesando}
            >
              Revisar
            </Button>
            <Button 
              onClick={alConfirmar}
              variant="primary"
              className="flex-1"
              disabled={estaProcesando}
            >
              {estaProcesando ? 'Enviando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
