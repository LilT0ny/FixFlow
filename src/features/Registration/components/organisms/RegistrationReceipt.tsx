import React, { useEffect, useMemo } from 'react';
import { CheckCircle, Printer, RefreshCw } from 'lucide-react';
import type { DeviceCheckInForm } from '../../../../types';
import { printReceiptDoubleCopy } from '../../../../utils/printHelpers';
import { Button } from '../../../../components/atoms/Button';
import { Card } from '../../../../components/atoms/Card';
import { useSettings } from '../../../../hooks/useSettings';

interface RegistrationReceiptProps {
  data: DeviceCheckInForm;
  orderNumber: string;
  onReset: () => void;
}

export const RegistrationReceipt: React.FC<RegistrationReceiptProps> = ({ data, orderNumber, onReset }) => {
  const { settings } = useSettings();

  const receiptData = useMemo(() => ({
    ...data,
    orderNumber,
    createdAt: new Date().toISOString(), // Still sending ISO but the print helper will handle it
    businessName: settings.companyName,
    businessLogo: settings.logo,
    businessPhone: settings.phone,
    businessAddress: settings.address
  }), [data, orderNumber, settings]);

  const handlePrint = () => {
    printReceiptDoubleCopy(receiptData, settings.printerType || '80mm', 'ticket', settings);
  };

  // AUTO-PRINT UPON COMPONENT LOAD
  useEffect(() => {
    const timer = setTimeout(() => {
      printReceiptDoubleCopy(receiptData, settings.printerType || '80mm', 'ticket', settings);
    }, 800);
    return () => clearTimeout(timer);
  }, [receiptData, settings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full py-8">
      <Card className="overflow-hidden p-0 border-0 shadow-lg">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-8 text-white text-center relative overflow-hidden">
           <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 p-3 rounded-full mb-4 ring-4 ring-white/10">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">¡Éxito!</h2>
              <p className="text-primary-100 mt-2 text-sm font-medium uppercase tracking-wider">Orden #{orderNumber}</p>
           </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-100">
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Detalles del Cliente</h3>
              <div className="space-y-1 text-surface-800">
                <p className="font-medium text-base">{data.customer.fullName}</p>
                <p>Cédula: <span className="text-surface-600">{data.customer.documentId}</span></p>
                <p>Teléfono: <span className="text-surface-600">{data.customer.phone}</span></p>
              </div>
            </div>

            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <h3 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3">Detalles del Dispositivo</h3>
              <div className="space-y-2 text-surface-800">
                <p><span className="text-surface-500">Dispositivo:</span> {data.device?.brand} {data.device?.model}</p>
                <p className="flex items-start gap-1">
                  <span className="text-surface-500 min-w-max">Falla:</span> 
                  <span className="font-medium text-danger-600">{data.repair.reportedIssue}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface-50 p-6 border-t border-surface-100 flex flex-col sm:flex-row gap-3">
           <Button 
             onClick={handlePrint}
             variant="outline"
             className="flex-1 w-full"
           >
             <Printer className="h-4 w-4 mr-2" />
             Imprimir Ticket
           </Button>
        </div>
      </Card>
      
      <div className="mt-8 text-center">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Registrar otro dispositivo
        </button>
      </div>
    </div>
  );
};
