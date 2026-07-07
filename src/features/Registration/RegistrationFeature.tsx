import React, { useState } from 'react';

// Organisms and Templates
import { RegistrationLayout } from './components/templates/RegistrationLayout';
import { RegistrationReceipt } from './components/organisms/RegistrationReceipt';

// Import our new DeviceRegistrationForm
import { DeviceRegistrationForm } from '../repairs/components/organisms/DeviceRegistrationForm';

// Custom Hooks Server Domain Logic (Controller)
import { useRegistration } from './hooks/useRegistration';
import type { DeviceCheckInForm } from '../../types';



// Initial state decoupled clearly
const INITIAL_REGISTRATION_STATE: DeviceCheckInForm = {
  customer: { fullName: '', documentId: '', phone: '', email: '' },
  device: { brand: '', model: '', serialNumber: '', deviceType: '', physicalCondition: '' },
  repair: { reportedIssue: '', evidencePhotos: [], initialDeposit: '', repairTotalCost: '' },
};

export const RegistrationFeature: React.FC = () => {
  const [formData, setFormData] = useState<DeviceCheckInForm>(INITIAL_REGISTRATION_STATE);

  // Business logic from the controller (Clean Architecture)
  const { 
    processRegistration, 
    isSubmitting, 
    createdOrder, 
    requestError, 
    resetRegistration 
  } = useRegistration();

  /**
   * Triggers the save to the server
   */
  const confirmAndProcess = async (data: DeviceCheckInForm) => {
    setFormData(data);
    await processRegistration(data);
  };

  // Success Screen
  if (createdOrder) {
    return (
      <RegistrationReceipt 
        data={formData} 
        orderNumber={createdOrder.orderNumber}
        onReset={() => {
          setFormData(INITIAL_REGISTRATION_STATE);
          resetRegistration();
        }} 
      />
    );
  }

  return (
    <RegistrationLayout title="Nuevo Ingreso" subtitle="Registra un nuevo dispositivo para reparación">
      {requestError && (
        <div className="bg-danger-50 border border-danger-100 text-danger-700 p-3.5 rounded-lg mb-6 text-sm animate-scale-in">
          {requestError}
        </div>
      )}

      {/* Our New Wizard Implementation */}
      <DeviceRegistrationForm 
        onSave={confirmAndProcess} 
        isSubmitting={isSubmitting} 
      />
      
    </RegistrationLayout>
  );
};
