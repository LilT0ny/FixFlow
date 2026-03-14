import React from 'react';
import { User, CreditCard, Phone, Mail } from 'lucide-react';
import type { CustomerData } from '../../types';

interface StepCustomerProps {
  data: CustomerData;
  onChange: (data: CustomerData) => void;
  onNext: () => void;
}

export const StepCustomer: React.FC<StepCustomerProps> = ({ data, onChange, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              required
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Ej. JUAN PÉREZ"
              value={data.fullName}
              onChange={(e) => {
                const validText = e.target.value.toUpperCase().replace(/[^A-ZÑ\s]/g, '');
                onChange({ ...data, fullName: validText });
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula o Documento <span className="text-red-500">*</span></label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              required
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Ej. 1712345678"
              value={data.documentId}
              onChange={(e) => onChange({ ...data, documentId: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              required
              className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors uppercase"
              placeholder="Ej. 0987654321"
              value={data.phone}
              onChange={(e) => onChange({ ...data, phone: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Mail className="h-5 w-5 text-gray-400" />
             </div>
             <input
               type="email"
               required
               className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-3 transition-colors"
               placeholder="Ej. cliente@correo.com"
               value={data.email || ''}
               onChange={(e) => onChange({ ...data, email: e.target.value })}
             />
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95"
        >
          Siguiente
        </button>
      </div>
    </form>
  );
};
