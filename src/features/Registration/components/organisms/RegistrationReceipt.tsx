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
    printReceiptDoubleCopy(receiptData, selectedFormat);
    setIsPrintModalOpen(false);
  };

  // AUTO-PRINT UPON COMPONENT LOAD
  useEffect(() => {
    const timer = setTimeout(() => {
      printReceiptDoubleCopy(receiptData, selectedFormat);
    }, 800);
    return () => clearTimeout(timer);
  }, [receiptData, selectedFormat]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto w-full py-8">
      <Card className="overflow-hidden p-0 border-0 shadow-lg">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-8 text-white text-center relative overflow-hidden">
           <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 p-3 rounded-full mb-4 ring-4 ring-white/10">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Success!</h2>
              <p className="text-primary-100 mt-2 text-sm font-medium uppercase tracking-wider">Order #{orderNumber}</p>
           </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-100">
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Customer Details</h3>
              <div className="space-y-1 text-surface-800">
                <p className="font-medium text-base">{data.customer.fullName}</p>
                <p>ID: <span className="text-surface-600">{data.customer.documentId}</span></p>
                <p>Phone: <span className="text-surface-600">{data.customer.phone}</span></p>
              </div>
            </div>

            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <h3 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3">Device Details</h3>
              <div className="space-y-2 text-surface-800">
                <p><span className="text-surface-500">Device:</span> {data.device?.brand} {data.device?.model}</p>
                <p className="flex items-start gap-1">
                  <span className="text-surface-500 min-w-max">Issue:</span> 
                  <span className="font-medium text-danger-600">{data.repair?.reportedIssue}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface-50 p-6 border-t border-surface-100 flex flex-col sm:flex-row gap-3">
           <Button 
             onClick={() => setIsPrintModalOpen(true)}
             variant="outline"
             className="flex-1 w-full"
           >
             <Printer className="h-4 w-4 mr-2" />
             Print Entry Ticket
           </Button>
        </div>
      </Card>
      
      <div className="mt-8 text-center">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Register another device
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
            
            <h3 className="text-xl font-bold tracking-tight text-surface-900 mb-1 flex items-center gap-2">
              <Printer className="w-6 h-6 text-primary-600"/> 
              Print Ticket
            </h3>
            <p className="text-sm text-surface-500 mb-6 font-medium">Order #{orderNumber}</p>
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-surface-700">Print Format</label>
              
              <div className="grid gap-3">
                {[
                  { id: '58mm', label: 'Thermal Ticket (58mm)', desc: 'Basic printer' },
                  { id: '80mm', label: 'Thermal Ticket (80mm)', desc: 'Wide printer' },
                  { id: 'A4', label: 'Normal Sheet (A4)', desc: 'Standard printer' }
                ].map(format => (
                  <label 
                    key={format.id} 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFormat === format.id ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-surface-200 hover:border-surface-300 bg-white text-surface-900'
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
                      <span className="block text-sm font-bold">
                        {format.label}
                      </span>
                      <span className="block text-xs text-surface-500 mt-0.5">{format.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 mt-2 border-t border-surface-100 flex flex-col gap-3">
                <Button onClick={handlePrint} variant="primary" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Send to Print
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
