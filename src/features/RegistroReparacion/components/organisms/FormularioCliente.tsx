import React from 'react';
import { User, CreditCard, Phone, Mail } from 'lucide-react';
import type { CustomerData } from '../../../../types';
import { Input } from '../../../../components/atoms/Input';
import { Button } from '../../../../components/atoms/Button';

interface FormularioClienteProps {
  clienteInfo: CustomerData;
  alActualizar: (datos: CustomerData) => void;
  alAvanzar: () => void;
}

/**
 * Organismo que representa el formulario de datos del cliente.
 * Sigue el principio SRP manejando únicamente UI e iteración de los datos del cliente.
 */
export const FormularioCliente: React.FC<FormularioClienteProps> = ({ clienteInfo, alActualizar, alAvanzar }) => {
  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    alAvanzar();
  };

  return (
    <form onSubmit={manejarEnvio} className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Nombre Completo <span className="text-danger-500">*</span></label>
          <Input
            type="text"
            required
            icon={<User className="w-5 h-5 text-surface-400" />}
            placeholder="Ej. JUAN PÉREZ"
            value={clienteInfo.fullName}
            className="uppercase"
            onChange={(e) => {
              const textoValido = e.target.value.toUpperCase().replace(/[^A-ZÑ\s]/g, '');
              alActualizar({ ...clienteInfo, fullName: textoValido });
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Cédula o Documento <span className="text-danger-500">*</span></label>
          <Input
            type="text"
            required
            icon={<CreditCard className="w-5 h-5 text-surface-400" />}
            placeholder="Ej. 1712345678"
            value={clienteInfo.documentId}
            className="uppercase"
            onChange={(e) => alActualizar({ ...clienteInfo, documentId: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Teléfono</label>
          <Input
            type="tel"
            required
            icon={<Phone className="w-5 h-5 text-surface-400" />}
            placeholder="Ej. 0987654321"
            value={clienteInfo.phone}
            className="uppercase"
            onChange={(e) => alActualizar({ ...clienteInfo, phone: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Correo Electrónico <span className="text-danger-500">*</span></label>
          <Input
            type="email"
            required
            icon={<Mail className="w-5 h-5 text-surface-400" />}
            placeholder="Ej. cliente@correo.com"
            value={clienteInfo.email || ''}
            onChange={(e) => alActualizar({ ...clienteInfo, email: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary">
          Siguiente
        </Button>
      </div>
    </form>
  );
};
