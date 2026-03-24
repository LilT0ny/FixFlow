import React, { useState } from 'react';

// Organisms and Templates
import { LayoutRegistro } from './components/templates/LayoutRegistro';
import { ReciboIngreso } from './components/organisms/ReciboIngreso';

// Import our new DeviceRegistrationForm
import { DeviceRegistrationForm } from '../repairs/components/organisms/DeviceRegistrationForm';

// Custom Hooks Server Domain Logic (Controller)
import { useRegistroReparacion } from './hooks/useRegistroReparacion';
import type { DeviceCheckInForm } from '../../types';

// Initial state decoupled clearly
const ESTADO_INICIAL_REGISTRO: DeviceCheckInForm = {
  customer: { fullName: '', documentId: '', phone: '', email: '' },
  device: { brand: '', model: '', serialNumber: '', deviceType: '', physicalCondition: '' },
  repair: { reportedIssue: '', evidencePhotos: [], initialDeposit: '', repairTotalCost: '' },
};

export const RegistroReparacionFeature: React.FC = () => {
  const [datosFormulario, setDatosFormulario] = useState<DeviceCheckInForm>(ESTADO_INICIAL_REGISTRO);

  // Consumo de lógica de negocio del controlador (Arquitectura Limpia)
  const { 
    procesarRegistro, 
    estaEnviando, 
    ordenCreada, 
    errorPeticion, 
    reiniciarRegistro 
  } = useRegistroReparacion();

  /**
   * Dispara el guardado al servidor
   */
  const confirmarYProcesar = async (data: DeviceCheckInForm) => {
    setDatosFormulario(data);
    await procesarRegistro(data);
  };

  // Pantalla de Exito
  if (ordenCreada) {
    return (
      <ReciboIngreso 
        data={datosFormulario} 
        orderNumber={ordenCreada.orderNumber}
        onReset={() => {
          setDatosFormulario(ESTADO_INICIAL_REGISTRO);
          reiniciarRegistro();
        }} 
      />
    );
  }

  return (
    <LayoutRegistro titulo="Nuevo Ingreso" subtitulo="Registra un dispositivo en tu taller.">
      {errorPeticion && (
        <div className="bg-danger-50 text-danger-600 p-4 rounded-xl mb-6 font-medium">
          {errorPeticion}
        </div>
      )}

      {/* Our New Wizard Implementation */}
      <DeviceRegistrationForm 
        onSave={confirmarYProcesar} 
        estaEnviando={estaEnviando} 
      />
      
    </LayoutRegistro>
  );
};
