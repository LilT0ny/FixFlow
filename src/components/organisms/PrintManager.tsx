import React, { useState } from 'react';
import type { ServiceOrder } from '../../types';
import { Button } from '../atoms/Button';
import { X, Printer } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { printReceipt } from '../../utils/printHelpers';

interface PrintManagerProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

type DocType = 'ingreso' | 'nota_venta';

export const PrintManager: React.FC<PrintManagerProps> = ({ order, isOpen, onClose }) => {
  const { settings } = useSettings();
  const [docType, setDocType] = useState<DocType>('ingreso');
  
  const format = settings.printerType || '80mm';

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    // Usar la función centralizada de impresión
    printReceipt(
      order, 
      format, 
      docType === 'nota_venta' ? 'nota-venta' : 'ticket', 
      false, // Una copia
      settings
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-surface-900/40 z-50 flex justify-center items-center py-10 px-4 animate-fade-in">
      <div className="bg-white rounded-xl border border-surface-200 shadow-lg w-full max-w-sm flex flex-col animate-scale-in overflow-hidden">
        <div className="p-5 border-b border-surface-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary-600" />
            Configurar impresión
          </h3>
          <button
            onClick={onClose}
            title="Cerrar ventana de impresión"
            className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Tipo de documento</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={docType === 'ingreso' ? 'primary' : 'outline'}
                onClick={() => setDocType('ingreso')}
                className="w-full text-xs py-2"
              >
                Ticket Ingreso
              </Button>
              <Button
                type="button"
                variant={docType === 'nota_venta' ? 'primary' : 'outline'}
                onClick={() => setDocType('nota_venta')}
                disabled={order.status !== 'entregado'}
                className="w-full text-xs py-2"
                title={order.status !== 'entregado' ? 'La Nota de Venta solo se genera al entregar el equipo' : ''}
              >
                Nota de Venta
              </Button>
            </div>
          </div>


          <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-2.5 text-xs text-primary-700 text-center">
            {docType === 'ingreso' ? (
              <>Se imprimirán <strong>2 COPIAS</strong>:<br/> (Términos + Firmas)</>
            ) : (
              <>Se imprimirá <strong>1 COPIA</strong></>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-surface-200 bg-surface-50 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" onClick={handlePrint} variant="success" className="flex-1">
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};

