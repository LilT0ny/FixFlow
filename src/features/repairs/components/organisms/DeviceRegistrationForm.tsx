import { useState, useMemo, useEffect } from 'react';
import { useDeviceValidation } from '../../hooks/useDeviceValidation';
import { Input } from '../../../../components/atoms/Input';
import { TextArea } from '../../../../components/atoms/TextArea';
import { Select } from '../../../../components/atoms/Select';
import { Button } from '../../../../components/atoms/Button';
import { FormField } from '../../../../components/molecules/FormField';
import { Card } from '../../../../components/atoms/Card';
import { OrderService } from '../../../../services/OrderService';
import { Loader2, CheckCircle2 } from 'lucide-react';

import type { DeviceCheckInForm, ServiceOrder } from '../../../../types';

interface TitleProps {
  onSave?: (data: DeviceCheckInForm) => void;
  isSubmitting?: boolean;
}

export const DeviceRegistrationForm = ({ onSave, isSubmitting }: TitleProps) => {
  const [step, setStep] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const { data, errors, touched, handleChange, handleBlur, validateAll, setData } = useDeviceValidation();

  // Estados para validacion de cliente existente
  const [isValidatingCedula, setIsValidatingCedula] = useState(false);
  const [foundClient, setFoundClient] = useState<ServiceOrder['customer'] | null>(null);
  const [showAutofillToast, setShowAutofillToast] = useState(false);

  // EFECTO: Buscar cliente automáticamente al completar 10 o 13 dígitos
  useEffect(() => {
    const cedula = data.cedula.trim();
    if (cedula.length === 10 || cedula.length === 13) {
      const checkClient = async () => {
        setIsValidatingCedula(true);
        try {
          const res = await OrderService.checkClientByCedula(cedula);
          if (res.found && res.client) {
            // Dividir el nombre completo en nombres y apellidos para el formulario
            const nameParts = res.client.fullName.split(' ');
            const nombres = nameParts[0] || '';
            const apellidos = nameParts.slice(1).join(' ') || '';
            
            // Limpiar el teléfono para que coincida con el formato 09
            let phone = res.client.phone || '';
            if (phone.startsWith('+593')) phone = '0' + phone.substring(4);
            if (phone.startsWith('593')) phone = '0' + phone.substring(3);
            
            setData(prev => ({
              ...prev,
              nombres: nombres.toUpperCase(),
              apellidos: apellidos.toUpperCase(),
              telefono: phone,
              email: res.client?.email ? res.client.email.toLowerCase() : prev.email
            }));
            
            setFoundClient(res.client);
            setShowAutofillToast(true);
            setTimeout(() => setShowAutofillToast(false), 3000);
          }
        } catch (err) {
          console.error('Error buscando cliente:', err);
        } finally {
          setIsValidatingCedula(false);
        }
      };
      checkClient();
    }
  }, [data.cedula, setData]); // Agregué setData a dependencias

  const handleNext = () => {
    let fieldsToValidate: (keyof typeof data)[] = [];
    if (step === 1) {
      fieldsToValidate = ['cedula', 'nombres', 'apellidos', 'telefono', 'email'];
    } else if (step === 2) {
      fieldsToValidate = ['deviceType', 'marca', 'modelo', 'imei', 'estadoFisico'];
    }

    if (validateAll(fieldsToValidate)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      if (onSave) {
        onSave({
          customer: {
            fullName: `${data.nombres} ${data.apellidos}`.trim(),
            documentId: data.cedula,
            phone: data.telefono,
            email: data.email
          },
          device: {
            brand: data.marca,
            model: data.modelo,
            serialNumber: data.imei,
            deviceType: data.deviceType as NonNullable<DeviceCheckInForm['device']>['deviceType'],
            physicalCondition: data.estadoFisico
          },
          repair: {
            reportedIssue: data.trabajoRealizar,
            evidencePhotos: [],
            initialDeposit: data.abonoInicial,
            repairTotalCost: data.costoEstimado
          }
        });
        
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      } else {
        alert('Registro guardado exitosamente: \n' + JSON.stringify(data, null, 2));
      }
    }
  };

  const isStep1Valid = useMemo(() => {
    const hasErrors = !!(errors.cedula || errors.nombres || errors.apellidos || errors.telefono || errors.email);
    const hasEmpties = !data.cedula || !data.nombres || !data.apellidos || !data.telefono;
    return !hasErrors && !hasEmpties && !isValidatingCedula;
  }, [data, errors, isValidatingCedula]);

  const isStep2Valid = useMemo(() => {
    const hasErrors = !!(errors.deviceType || errors.marca || errors.modelo || errors.imei || errors.estadoFisico);
    const hasEmpties = !data.deviceType || !data.marca || !data.modelo;
    return !hasErrors && !hasEmpties;
  }, [data, errors]);

  const isStep3Valid = useMemo(() => {
    const hasErrors = !!(errors.trabajoRealizar || errors.costoEstimado || errors.abonoInicial);
    const hasEmpties = !data.trabajoRealizar;
    return !hasErrors && !hasEmpties;
  }, [data, errors]);

  const isNextDisabled = (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid);
  const isSaveDisabled = step === 3 && !isStep3Valid;

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-surface-900">Registro de Dispositivo</h2>
        <div className="flex gap-2 mt-4">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-surface-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-surface-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary-500' : 'bg-surface-200'}`} />
        </div>
        <p className="text-sm text-surface-500 mt-2">Paso {step} de 3</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-800 border-b pb-2">Informacion del Cliente</h3>
            <FormField label="Cedula / RUC" required error={touched.cedula ? errors.cedula : undefined} charCount={data.cedula.length} maxChars={13}>
              <div className="relative">
                <Input placeholder="10 digitos (Cedula) o 13 (RUC)" value={data.cedula} onChange={e => handleChange('cedula', e.target.value)} onBlur={() => handleBlur('cedula')} error={touched.cedula && !!errors.cedula} maxLength={13} disabled={isValidatingCedula} />
                {isValidatingCedula && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              </div>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nombres" required error={touched.nombres ? errors.nombres : undefined}>
                <Input placeholder="EJ: JUAN" value={data.nombres} onChange={e => handleChange('nombres', e.target.value)} onBlur={() => handleBlur('nombres')} error={touched.nombres && !!errors.nombres} />
              </FormField>
              <FormField label="Apellidos" required error={touched.apellidos ? errors.apellidos : undefined}>
                <Input placeholder="EJ: PEREZ" value={data.apellidos} onChange={e => handleChange('apellidos', e.target.value)} onBlur={() => handleBlur('apellidos')} error={touched.apellidos && !!errors.apellidos} />
              </FormField>
            </div>
            <FormField label="Telefono" required error={touched.telefono ? errors.telefono : undefined}>
              <div className="flex flex-col gap-1">
                <Input 
                  placeholder="Ej. 0987654321" 
                  value={data.telefono} 
                  onChange={e => handleChange('telefono', e.target.value)} 
                  onBlur={() => handleBlur('telefono')} 
                  error={touched.telefono && !!errors.telefono} 
                  maxLength={10} 
                  className="font-mono tracking-wider"
                />
                <span className={`text-xs font-bold self-end ${data.telefono.length === 10 ? 'text-success-600' : 'text-warning-600'}`}>
                  {data.telefono.length < 10 ? `${10 - data.telefono.length} faltantes` : 'Completo ✓'}
                </span>
              </div>
            </FormField>
            <FormField label="Correo Electronico" error={touched.email ? errors.email : undefined}>
              <Input type="email" placeholder="Ej: usuario@edu.ec" value={data.email} onChange={e => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} error={touched.email && !!errors.email} />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-800 border-b pb-2">Informacion del Dispositivo</h3>
            <FormField label="Tipo de Equipo" required error={touched.deviceType ? errors.deviceType : undefined}>
              <Select value={data.deviceType} onChange={e => handleChange('deviceType', e.target.value)} onBlur={() => handleBlur('deviceType')} error={touched.deviceType && !!errors.deviceType}>
                <option value="" disabled>Seleccione un tipo...</option>
                <option value="celular">Celular</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Tablet</option>
                <option value="impresora">Impresora</option>
                <option value="otro">Otro</option>
              </Select>
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Marca" required error={touched.marca ? errors.marca : undefined}>
                <Input placeholder="EJ: SAMSUNG" value={data.marca} onChange={e => handleChange('marca', e.target.value)} onBlur={() => handleBlur('marca')} error={touched.marca && !!errors.marca} />
              </FormField>
              <FormField label="Modelo" required error={touched.modelo ? errors.modelo : undefined}>
                <Input placeholder="EJ: GALAXY S23" value={data.modelo} onChange={e => handleChange('modelo', e.target.value)} onBlur={() => handleBlur('modelo')} error={touched.modelo && !!errors.modelo} />
              </FormField>
            </div>
            <FormField label="IMEI/Serial (Opcional)" error={touched.imei ? errors.imei : undefined} charCount={data.imei.length} maxChars={15}>
              <Input placeholder="15 digitos exactos" value={data.imei} onChange={e => handleChange('imei', e.target.value)} onBlur={() => handleBlur('imei')} error={touched.imei && !!errors.imei} maxLength={15} />
            </FormField>
            <FormField label="Estado Fisico del Dispositivo" error={touched.estadoFisico ? errors.estadoFisico : undefined} charCount={data.estadoFisico.length} maxChars={200}>
              <TextArea placeholder="EJ: PANTALLA ROTA, SIN BOTONES LATERALES..." value={data.estadoFisico} onChange={e => handleChange('estadoFisico', e.target.value)} onBlur={() => handleBlur('estadoFisico')} error={touched.estadoFisico && !!errors.estadoFisico} rows={3} maxLength={200} />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-800 border-b pb-2">Economico y Trabajo</h3>
            <FormField label="Trabajo a Realizar" required error={touched.trabajoRealizar ? errors.trabajoRealizar : undefined} charCount={data.trabajoRealizar.length} maxChars={300}>
              <TextArea placeholder="EJ: CAMBIO DE PANTALLA Y BATERIA..." value={data.trabajoRealizar} onChange={e => handleChange('trabajoRealizar', e.target.value)} onBlur={() => handleBlur('trabajoRealizar')} error={touched.trabajoRealizar && !!errors.trabajoRealizar} rows={4} maxLength={300} />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Costo Estimado ($)" error={touched.costoEstimado ? errors.costoEstimado : undefined}>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={data.costoEstimado} onChange={e => handleChange('costoEstimado', e.target.value)} onBlur={() => handleBlur('costoEstimado')} error={touched.costoEstimado && !!errors.costoEstimado} />
              </FormField>
              <FormField label="Abono Inicial ($)" error={touched.abonoInicial ? errors.abonoInicial : undefined}>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={data.abonoInicial} onChange={e => handleChange('abonoInicial', e.target.value)} onBlur={() => handleBlur('abonoInicial')} error={touched.abonoInicial && !!errors.abonoInicial} />
              </FormField>
            </div>
            <div className="bg-primary-50 p-4 rounded-xl mt-6 border border-primary-100">
              <p className="text-sm text-primary-900">
                <strong>Resumen:</strong> El equipo {data.marca} {data.modelo} sera registrado a nombre de {data.nombres} {data.apellidos}.
                Revisa los datos antes de guardar.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t mt-8">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={handlePrev}>Anterior</Button>
          ) : (
            <div></div>
          )}
          {step < 3 ? (
            <Button type="button" onClick={handleNext} disabled={isNextDisabled} className={isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''}>Siguiente</Button>
          ) : (
            <Button type="submit" disabled={isSaveDisabled || isSubmitting} className={isSaveDisabled || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}>
              {isSubmitting ? 'Saving...' : 'Save Registration'}
            </Button>
          )}
        </div>
      </form>


      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Registro Exitoso</p>
              <p className="text-xs text-surface-400">El dispositivo y la orden han sido guardados.</p>
            </div>
          </div>
        </div>
      )}

      {showAutofillToast && foundClient && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-primary-400">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm font-medium">Cliente encontrado: {foundClient.fullName}</p>
          </div>
        </div>
      )}
    </Card>
  );
};
