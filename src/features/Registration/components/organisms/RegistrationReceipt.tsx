import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Printer, RefreshCw, X } from 'lucide-react';
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(settings.printerType || '80mm');

  const receiptData = useMemo(() => ({
    ...data,
    orderNumber,
    createdAt: new Date().toISOString(),
    businessName: settings.companyName,
    businessLogo: settings.logo,
    businessPhone: settings.phone,
    businessAddress: settings.address
  }), [data, orderNumber, settings]);

  const handlePrint = () => {
    printReceiptDoubleCopy(receiptData, selectedFormat, 'ticket', settings);
    setIsPrintModalOpen(false);
  };

  // AUTO-PRINT UPON COMPONENT LOAD
  useEffect(() => {
    const timer = setTimeout(() => {
      printReceiptDoubleCopy(receiptData, selectedFormat, 'ticket', settings);
    }, 800);
    return () => clearTimeout(timer);
  }, [receiptData, selectedFormat, settings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full py-8">
      <Card className="overflow-hidden p-0 border-0 shadow-lg">
        {/* Header */}
        <div className="bg-surface-900 px-6 py-8 text-white text-center">
           <div className="flex flex-col items-center">
              <div className="bg-emerald-500 p-3 rounded-full mb-4 animate-scale-in">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">¡Registro exitoso!</h2>
              <p className="text-surface-300 mt-1 text-sm">Orden #{orderNumber}</p>
           </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-surface-50 rounded-lg border border-surface-200">
              <h3 className="text-xs font-medium text-surface-500 mb-2.5">Datos del cliente</h3>
              <div className="space-y-1 text-sm text-surface-800">
                <p className="font-medium text-base">{data.customer.fullName}</p>
                <p>Cédula: <span className="text-surface-600">{data.customer.documentId}</span></p>
                <p>Teléfono: <span className="text-surface-600">{data.customer.phone}</span></p>
              </div>
            </div>

            <div className="p-4 bg-primary-50/50 rounded-lg border border-primary-100">
              <h3 className="text-xs font-medium text-primary-700 mb-2.5">Datos del equipo</h3>
              <div className="space-y-1.5 text-sm text-surface-800">
                <p><span className="text-surface-500">Equipo:</span> {data.device?.brand} {data.device?.model}</p>
                <p className="flex items-start gap-1">
                  <span className="text-surface-500 min-w-max">Falla:</span>
                  <span className="font-medium">{data.repair?.reportedIssue}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface-50 p-5 border-t border-surface-200 flex flex-col sm:flex-row gap-3">
           <Button
             onClick={() => setIsPrintModalOpen(true)}
             variant="outline"
             className="flex-1 w-full"
           >
             <Printer className="h-4 w-4" />
             Imprimir ticket de ingreso
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

      {/* Print Configuration Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <Card className="w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-8 duration-300 relative">
            <button 
              onClick={() => setIsPrintModalOpen(false)}
              title="Close print settings"
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 bg-surface-100 hover:bg-surface-200 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-semibold tracking-tight text-surface-900 mb-1 flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary-600"/>
              Imprimir ticket
            </h3>
            <p className="text-sm text-surface-500 mb-6">Orden #{orderNumber}</p>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-surface-700">Formato de impresión</label>

              <div className="grid gap-2.5">
                {[
                  { id: '58mm', label: 'Ticket térmico (58mm)', desc: 'Impresora básica' },
                  { id: '80mm', label: 'Ticket térmico (80mm)', desc: 'Impresora ancha' },
                  { id: 'A4', label: 'Hoja normal (A4)', desc: 'Impresora estándar' }
                ].map(format => (
                  <label
                    key={format.id}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors duration-150 ${
                      selectedFormat === format.id ? 'border-primary-500 bg-primary-50/50 text-surface-900' : 'border-surface-300 hover:border-surface-400 bg-white text-surface-900'
                    }`}
                  >
                    <div className="flex h-5 items-center">
                      <input 
                        type="radio" 
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value as '58mm' | '80mm')}
                        className="h-4 w-4 text-primary-600 border-surface-300 focus:ring-primary-600" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium">
                        {format.label}
                      </span>
                      <span className="block text-xs text-surface-500 mt-0.5">{format.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 mt-2 border-t border-surface-200 flex flex-col gap-3">
                <Button onClick={handlePrint} variant="primary" className="w-full">
                  <Printer className="w-4 h-4" />
                  Enviar a imprimir
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
