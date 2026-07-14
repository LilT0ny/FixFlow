import React, { useState } from 'react';
import { SquarePlus } from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../../../components/molecules/Modal';
import { DeviceRegistrationForm } from '../../../repairs/components/organisms/DeviceRegistrationForm';
import { RegistrationReceipt } from '../../../Registration/components/organisms/RegistrationReceipt';
import { useRegistration } from '../../../Registration/hooks/useRegistration';
import type { DeviceCheckInForm } from '../../../../types';

interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_REGISTRATION_STATE: DeviceCheckInForm = {
  customer: { fullName: '', documentId: '', phone: '', email: '' },
  device: { brand: '', model: '', serialNumber: '', deviceType: '', physicalCondition: '' },
  repair: { reportedIssue: '', evidencePhotos: [], initialDeposit: '', repairTotalCost: '' },
};

/**
 * "Nuevo ingreso" vive acá en vez de en su propia vista/ruta — mismo
 * criterio que NuevaVentaModal: disparado desde Inicio, gateado por el
 * permiso de módulo 'registro' en el botón que lo abre (DashboardFeature).
 */
export const NewDeviceModal: React.FC<NewDeviceModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<DeviceCheckInForm>(INITIAL_REGISTRATION_STATE);
  const { processRegistration, isSubmitting, createdOrder, requestError, resetRegistration } = useRegistration();

  const confirmAndProcess = async (data: DeviceCheckInForm) => {
    setFormData(data);
    await processRegistration(data);
  };

  const resetForm = () => {
    setFormData(INITIAL_REGISTRATION_STATE);
    resetRegistration();
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300); // esperar a que cierre la animación antes de limpiar
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalHeader
        title="Nuevo ingreso"
        subtitle="Registrá un nuevo dispositivo para reparación"
        icon={<SquarePlus className="w-5 h-5" />}
        iconClassName="bg-primary-50 text-primary-600 dark:bg-blue-950/40 dark:text-blue-400"
        onClose={handleClose}
        closeDisabled={isSubmitting}
      />

      {createdOrder ? (
        <ModalBody>
          <RegistrationReceipt
            data={formData}
            orderNumber={createdOrder.orderNumber}
            onReset={resetForm}
          />
        </ModalBody>
      ) : (
        <ModalBody>
          {requestError && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 p-3.5 rounded-lg mb-6 text-sm animate-scale-in dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
              {requestError}
            </div>
          )}
          <DeviceRegistrationForm onSave={confirmAndProcess} isSubmitting={isSubmitting} />
        </ModalBody>
      )}
    </Modal>
  );
};
