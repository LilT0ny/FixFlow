import React, { useState } from 'react';
import type { ServiceOrder } from '../../types';
import { Button } from '../atoms/Button';
import { Printer } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { printReceipt } from '../../utils/printHelpers';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../molecules/Modal';

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

  if (!order) return null;

  const hasNota = !!order.notaVenta;

  const handlePrint = () => {
    if (docType === 'nota_venta' && order.notaVenta) {
      // La nota se imprime con SU numeración (NT-xxxxx), no la de la orden
      printReceipt(
        { ...order, orderNumber: order.notaVenta.numero },
        format,
        'nota-venta',
        false,
        settings
      );
    } else {
      printReceipt(order, format, 'ticket', false, settings);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title="Configurar impresión"
        icon={<Printer className="w-5 h-5" />}
        iconClassName="bg-primary-50 text-primary-600"
        onClose={onClose}
      />

      <ModalBody className="space-y-5">
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
              disabled={!hasNota}
              className="w-full text-xs py-2"
              title={!hasNota ? 'Esta orden no tiene nota de venta generada (se genera al entregar)' : `Nota ${order.notaVenta?.numero}`}
            >
              Nota de Venta
            </Button>
          </div>
          {!hasNota && (
            <p className="text-xs text-surface-400 mt-2">
              Esta orden no tiene nota de venta generada. Se genera al marcar la entrega.
            </p>
          )}
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-2.5 text-xs text-primary-700 text-center">
          {docType === 'ingreso' ? (
            <>Se imprimirán <strong>2 COPIAS</strong>:<br/> (Términos + Firmas)</>
          ) : (
            <>Se imprimirá la nota <strong>{order.notaVenta?.numero}</strong> — 1 copia</>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" onClick={handlePrint} variant="success" className="flex-1">
          Imprimir
        </Button>
      </ModalFooter>
    </Modal>
  );
};

