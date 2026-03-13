import React, { useState } from 'react';
import { CheckCircle, Printer, Download, RefreshCw, X } from 'lucide-react';
import type { DeviceCheckInForm } from '../../types';
import { printReceipt } from '../../utils/printHelpers';

interface CheckInReceiptProps {
  data: DeviceCheckInForm;
  orderNumber: string;
  onReset: () => void;
}

export const CheckInReceipt: React.FC<CheckInReceiptProps> = ({ data, orderNumber, onReset }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('58mm');
  const [isPdfMode, setIsPdfMode] = useState(false);

  const handlePrint = () => {
    printReceipt({...data, orderNumber, createdAt: new Date().toISOString() }, selectedFormat);
    setIsPrintModalOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl border shadow-sm max-w-lg mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-8 text-white text-center rounded-t-2xl relative overflow-hidden">
           <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/20 p-3 rounded-full mb-4 ring-4 ring-white/10">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">¡Ingreso Exitoso!</h2>
              <p className="text-blue-100 mt-2 text-sm font-medium uppercase tracking-wider">Orden #{orderNumber}</p>
           </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            
            {/* Details section */}
            <div className="flex-1 space-y-4 text-sm">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Datos del Cliente</h3>
                <div className="space-y-1 text-gray-800">
                  <p className="font-medium text-base">{data.customer.fullName}</p>
                  <p>CI: <span className="text-gray-600">{data.customer.documentId}</span></p>
                  <p>Tel: <span className="text-gray-600">{data.customer.phone}</span></p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Detalle del Equipo</h3>
                <div className="space-y-2 text-gray-800">
                  <p><span className="text-gray-500">Equipo:</span> {data.device.brand} {data.device.model}</p>
                  <p className="flex items-start gap-1">
                    <span className="text-gray-500 min-w-max">Falla:</span> 
                    <span className="font-medium text-red-600">{data.repair.reportedIssue}</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 border-t flex flex-col sm:flex-row gap-3">
           <button 
             onClick={() => setIsPrintModalOpen(true)}
             className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <Printer className="h-4 w-4" />
             Imprimir
           </button>
           <button 
             onClick={() => {
                setIsPdfMode(true);
                setSelectedFormat('A4'); // PDF is best viewed in A4 Usually
                setIsPrintModalOpen(true);
             }}
             className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <Download className="h-4 w-4" />
             PDF
           </button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Registrar otro equipo
        </button>
      </div>

      {/* Modal Configuración Impresión */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-8 duration-300 relative">
            <button 
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1 flex items-center gap-2">
              <Printer className="w-6 h-6 text-blue-600"/> 
              {isPdfMode ? 'Descargar PDF' : 'Imprimir Recibo'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Orden #{orderNumber}</p>
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Formato de Impresión</label>
              
              <div className="grid gap-3">
                {[
                  { id: '58mm', label: 'Ticket Térmico (58mm)', desc: 'Impresora básica' },
                  { id: '80mm', label: 'Ticket Térmico (80mm)', desc: 'Impresora ancha' },
                  { id: 'A4', label: 'Hoja Normal (A4)', desc: 'Impresora estándar' }
                ].map(format => (
                  <label 
                    key={format.id} 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedFormat === format.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex h-5 items-center">
                      <input 
                        type="radio" 
                        name="print-format-receipt" 
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-600" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className={`block text-sm font-bold ${selectedFormat === format.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {format.label}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">{format.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-3">
                {isPdfMode && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    💡 <strong>Tip:</strong> Para guardar como PDF, selecciona "Guardar como PDF / Save as PDF" en la lista de impresoras.
                  </p>
                )}
                <button 
                  onClick={handlePrint}
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Enviar a Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

