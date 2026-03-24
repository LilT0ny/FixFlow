import React, { useState } from 'react';
import type { DeviceCheckInForm as FormType } from '../../types';
import { StepCustomer } from './StepCustomer';
import { StepDevice } from './StepDevice';
import { StepRepairDetails } from './StepRepairDetails';
import { CheckInReceipt } from './CheckInReceipt';
import { ClipboardList, Smartphone, Wrench } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';

const initialData: FormType = {
  customer: {
    fullName: '',
    documentId: '',
    phone: '',
    email: '',
  },
  device: {
    brand: '',
    model: '',
    serialNumber: '',
    deviceType: '',
    physicalCondition: '',
  },
  repair: {
    reportedIssue: '',
    evidencePhotos: [],
    initialDeposit: '',
    repairTotalCost: '',
  },
};

export const CheckInForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormType>(initialData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const { addOrder } = useAppContext();

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  
  const onSubmitRequest = () => {
    setConfirmSubmitModal(true);
  };

  const handleSubmit = async () => {
    setConfirmSubmitModal(false);
    
    // API call to PHP
    try {
      const newOrder = await addOrder(formData);
      setCreatedOrderNumber(newOrder.orderNumber);
      setIsSubmitted(true);

      // Automate WhatsApp notification
      let phoneNumber = formData.customer.phone.replace(/\D/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '593' + phoneNumber.substring(1);
      }
      const message = `Hola ${formData.customer.fullName}, te informamos que tu ${formData.device.brand} ${formData.device.model} ha sido recibido en nuestro taller con la orden #${newOrder.orderNumber}.`;
      const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error in submission:', error);
      alert('Hubo un error al guardar la orden.');
    }
  };

  const steps = [
    { num: 1, title: 'Cliente', icon: ClipboardList },
    { num: 2, title: 'Equipo', icon: Smartphone },
    { num: 3, title: 'Detalles', icon: Wrench },
  ];

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <CheckInReceipt 
          data={formData} 
          orderNumber={createdOrderNumber}
          onReset={() => {
            setFormData(initialData);
            setStep(1);
            setIsSubmitted(false);
            setCreatedOrderNumber('');
          }} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border border-gray-100 overflow-hidden">
        
        {/* Header styling */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 sm:px-10 py-8 text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Nuevo Ingreso</h2>
            <p className="text-blue-100/90 font-medium">Registra un dispositivo en tu taller.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 sm:px-10 pt-8 pb-4">
          <div className="mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 rounded-full -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 rounded-full -translate-y-1/2 transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="relative flex justify-between">
              {steps.map(({ num, title, icon: Icon }) => (
                <div key={num} className="flex flex-col items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                      step >= num 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-semibold ${step >= num ? 'text-gray-800' : 'text-gray-400'}`}>
                    {title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 sm:px-10 pb-10">
          <div className="bg-white rounded-2xl">
            {step === 1 && (
              <StepCustomer
                data={formData.customer}
                onChange={(customer) => setFormData({ ...formData, customer })}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <StepDevice
                data={formData.device}
                onChange={(device) => setFormData({ ...formData, device })}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <StepRepairDetails
                data={formData.repair}
                onChange={(repair) => setFormData({ ...formData, repair })}
                onSubmit={onSubmitRequest}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmSubmitModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                 <ClipboardList className="w-8 h-8 text-blue-600" />
               </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-center text-gray-900 mb-2">
              ¿Confirmar Ingreso?
            </h3>
            <p className="text-sm text-center text-gray-500 mb-4">
              Revisa los datos antes de registrar el dispositivo en el sistema.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-bold text-gray-900 text-right">{formData.customer.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Equipo:</span>
                <span className="font-bold text-gray-900 text-right">{formData.device.brand} {formData.device.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IMEI/SN:</span>
                <span className="font-bold text-gray-900 text-right">{formData.device.serialNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Total a Cobrar:</span>
                <span className="font-bold text-blue-600 text-right">${typeof formData.repair.repairTotalCost === 'number' ? formData.repair.repairTotalCost.toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Abono Inicial:</span>
                <span className="font-bold text-green-600 text-right">${typeof formData.repair.initialDeposit === 'number' && formData.repair.initialDeposit > 0 ? formData.repair.initialDeposit.toFixed(2) : '0.00'}</span>
              </div>
            </div>
            </div>
            
            <div className="p-6 pt-4 border-t border-gray-100 bg-white rounded-b-3xl shrink-0">
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmSubmitModal(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Revisar
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
