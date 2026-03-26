import React, { useEffect } from 'react';
import { User, CreditCard, Phone, Mail, CheckCircle } from 'lucide-react';
import type { CustomerData } from '../../../../types';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';

interface CustomerFormProps {
  customerInfo: CustomerData;
  existingCustomer: CustomerData | null;
  onUpdate: (data: CustomerData) => void;
  onNext: () => void;
  onCheckCustomer: (documentId: string) => void;
}

/**
 * Organism that represents the customer data form.
 * Follows SRP principle by only handling UI and customer data iteration.
 */
export const CustomerForm: React.FC<CustomerFormProps> = ({ 
  customerInfo, 
  existingCustomer, 
  onUpdate, 
  onNext, 
  onCheckCustomer 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  // Logic to auto-fill if an existing customer is found
  useEffect(() => {
    if (existingCustomer) {
      onUpdate({
        ...customerInfo,
        fullName: existingCustomer.fullName,
        phone: existingCustomer.phone,
        email: existingCustomer.email || '',
        address: existingCustomer.address || ''
      });
    }
  }, [existingCustomer, customerInfo, onUpdate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">ID or Document <span className="text-danger-500">*</span></label>
          <div className="relative">
            <Input
              type="text"
              required
              icon={<CreditCard className="w-5 h-5 text-surface-400" />}
              placeholder="Ex. 1712345678"
              value={customerInfo.documentId}
              className="uppercase lg:pr-10"
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                onUpdate({ ...customerInfo, documentId: val });
                if (val.length >= 10) onCheckCustomer(val);
              }}
              onBlur={() => onCheckCustomer(customerInfo.documentId)}
            />
            {existingCustomer && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-success-600 bg-success-50 px-2 py-1 rounded-full border border-success-100">
                <CheckCircle className="w-3 h-3" />
                FOUND
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Full Name <span className="text-danger-500">*</span></label>
          <Input
            type="text"
            required
            icon={<User className="w-5 h-5 text-surface-400" />}
            placeholder="Ex. JOHN DOE"
            value={customerInfo.fullName}
            className="uppercase"
            onChange={(e) => {
              const validText = e.target.value.toUpperCase().replace(/[^A-ZÑ\s]/g, '');
              onUpdate({ ...customerInfo, fullName: validText });
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 flex justify-between">
              <span>Teléfono <span className="text-danger-500">*</span></span>
              <span className={`text-xs font-bold ${customerInfo.phone.length === 10 ? 'text-success-600' : 'text-warning-600'}`}>
                {customerInfo.phone.length < 10 ? `${10 - customerInfo.phone.length} faltantes` : 'Completo ✓'}
              </span>
            </label>
            <Input
              type="tel"
              required
              icon={<Phone className="w-5 h-5 text-surface-400" />}
              placeholder="Ej. 0987654321"
              value={customerInfo.phone}
              className="font-mono tracking-wider"
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                // Siempre forzar que empiece con 09 si hay algo de texto
                if (val.length > 0 && !val.startsWith('09')) {
                  // Si el usuario borra el 09 but keeps typing something else, we re-insert it
                  if (val.startsWith('9')) val = '0' + val;
                  else if (!val.startsWith('0')) val = '09' + val;
                }
                if (val.length > 10) val = val.substring(0, 10);
                onUpdate({ ...customerInfo, phone: val });
              }}
              onFocus={() => {
                if (!customerInfo.phone) onUpdate({ ...customerInfo, phone: '09' });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
            <Input
              type="email"
              icon={<Mail className="w-5 h-5 text-surface-400" />}
              placeholder="Ex. customer@mail.com"
              value={customerInfo.email || ''}
              onChange={(e) => onUpdate({ ...customerInfo, email: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary" className="px-10">
          Next Step
        </Button>
      </div>
    </form>
  );
};
