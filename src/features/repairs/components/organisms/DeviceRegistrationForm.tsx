import { useState, useMemo, useEffect } from 'react';
import { useDeviceValidation } from '../../hooks/useDeviceValidation';
import { Input } from '../../../../components/atoms/Input';
import { TextArea } from '../../../../components/atoms/TextArea';
import { Select } from '../../../../components/atoms/Select';
import { FormField } from '../../../../components/molecules/FormField';
import { OrderService } from '../../../../services/OrderService';
import { Loader2, CheckCircle2, Users, MonitorSmartphone, FileText } from 'lucide-react';

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
              email: res.client?.email ? res.client.email.toLowerCase() : prev.email,
              direccion: res.client?.address ? res.client.address.toUpperCase() : prev.direccion
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
  }, [data.cedula, setData]);

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
            email: data.email,
            address: data.direccion
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
    <div className="relative animate-fade-in-up">
      
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-surface-900 tracking-tight">Registro de ingreso</h2>
            <p className="text-sm text-surface-500 mt-0.5">Completá los tres pasos para generar la orden.</p>
          </div>
          <div className="text-left sm:text-right">
             <span className="text-xs text-surface-500 block mb-0.5">Progreso</span>
             <span className="text-sm font-semibold text-surface-900">Paso {step} de 3</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-surface-900' : 'bg-surface-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-surface-900' : 'bg-surface-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-surface-900' : 'bg-surface-200'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-sm font-semibold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Datos del Propietario
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Identificación (Cédula/RUC)" required error={touched.cedula ? errors.cedula : undefined}>
                <div className="relative group">
                  <Input 
                    placeholder="Escribe la identificación..." 
                    value={data.cedula} 
                    onChange={e => handleChange('cedula', e.target.value)} 
                    onBlur={() => handleBlur('cedula')} 
                    error={touched.cedula && !!errors.cedula} 
                    maxLength={13} 
                    className="pr-16"
                    disabled={isValidatingCedula} 
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${(data.cedula.length === 10 || data.cedula.length === 13) ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-400'}`}>
                      {data.cedula.length}
                    </span>
                  </div>
                  {isValidatingCedula && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                  {!isValidatingCedula && (data.cedula.length === 10 || data.cedula.length === 13) && !errors.cedula && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </FormField>

              <FormField label="Teléfono / WhatsApp" required error={touched.telefono ? errors.telefono : undefined}>
                <div className="relative">
                  <Input 
                    placeholder="09..." 
                    value={data.telefono} 
                    onChange={e => handleChange('telefono', e.target.value)} 
                    onBlur={() => handleBlur('telefono')} 
                    error={touched.telefono && !!errors.telefono} 
                    maxLength={10} 
                    className="pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${data.telefono.length === 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-400'}`}>
                      {data.telefono.length}/10
                    </span>
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nombres Completos" required error={touched.nombres ? errors.nombres : undefined}>
                <Input 
                  placeholder="Ej: Juan Antonio" 
                  value={data.nombres} 
                  onChange={e => handleChange('nombres', e.target.value)} 
                  onBlur={() => handleBlur('nombres')} 
                  error={touched.nombres && !!errors.nombres}                />
              </FormField>
              <FormField label="Apellidos Completos" required error={touched.apellidos ? errors.apellidos : undefined}>
                <Input 
                  placeholder="Ej: Pérez García" 
                  value={data.apellidos} 
                  onChange={e => handleChange('apellidos', e.target.value)} 
                  onBlur={() => handleBlur('apellidos')} 
                  error={touched.apellidos && !!errors.apellidos}                 />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Correo de Contacto" error={touched.email ? errors.email : undefined}>
                <Input 
                  type="email" 
                  placeholder="usuario@ejemplo.com" 
                  value={data.email} 
                  onChange={e => handleChange('email', e.target.value)} 
                  onBlur={() => handleBlur('email')} 
                  error={touched.email && !!errors.email}                 />
              </FormField>
              
              <FormField label="Domicilio / Referencia" error={touched.direccion ? errors.direccion : undefined}>
                <Input 
                  placeholder="Sector / Calle..." 
                  value={data.direccion} 
                  onChange={e => handleChange('direccion', e.target.value)} 
                  onBlur={() => handleBlur('direccion')} 
                  error={touched.direccion && !!errors.direccion}                 />
              </FormField>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-sm font-semibold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4 text-primary-500" />
              Especificaciones de Hardware
            </h3>
            
            <FormField label="Categoría de Dispositivo" required error={touched.deviceType ? errors.deviceType : undefined}>
              <Select 
                value={data.deviceType} 
                onChange={e => handleChange('deviceType', e.target.value)} 
                onBlur={() => handleBlur('deviceType')} 
                error={touched.deviceType && !!errors.deviceType}
              >
                <option value="" disabled>Selecciona una categoría...</option>
                <option value="celular">Celular / Smartphone</option>
                <option value="laptop">Computadora Portátil / Laptop</option>
                <option value="tablet">Tablet / iPad</option>
                <option value="impresora">Impresora / Multifunción</option>
                <option value="lavadora">Lavadora / Secadora</option>
                <option value="calefon">Calefón / Termotanque</option>
                <option value="refrigerador">Refrigerador / Nevera</option>
                <option value="microondas">Horno Microondas</option>
                <option value="tv">Televisor / Smart TV</option>
                <option value="cocina">Cocina / Horno a Gas</option>
                <option value="plancha">Plancha de Ropa</option>
                <option value="licuadora">Licuadora / Procesadora</option>
                <option value="otro">Otro Periférico</option>
              </Select>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Marca del Fabricante" required error={touched.marca ? errors.marca : undefined}>
                <Input 
                  placeholder="Ej: Apple, Samsung, Dell..." 
                  value={data.marca} 
                  onChange={e => handleChange('marca', e.target.value)} 
                  onBlur={() => handleBlur('marca')} 
                  error={touched.marca && !!errors.marca}                />
              </FormField>
              <FormField label="Modelo Específico" required error={touched.modelo ? errors.modelo : undefined}>
                <Input 
                  placeholder="Ej: Galaxy S24 Ultra, MacBook Pro..." 
                  value={data.modelo} 
                  onChange={e => handleChange('modelo', e.target.value)} 
                  onBlur={() => handleBlur('modelo')} 
                  error={touched.modelo && !!errors.modelo}                />
              </FormField>
            </div>

            <FormField label={data.deviceType === 'celular' ? "Número de IMEI *" : "Número de Serie / Serial *"} error={touched.imei ? errors.imei : undefined}>
              <div className="relative">
                <Input 
                  placeholder={data.deviceType === 'celular' ? "Ingresa el IMEI de 15 dígitos..." : "Ingresa el número de serie único..."} 
                  value={data.imei} 
                  onChange={e => handleChange('imei', e.target.value)} 
                  onBlur={() => handleBlur('imei')} 
                  error={touched.imei && !!errors.imei} 
                  maxLength={data.deviceType === 'celular' ? 15 : 30} 
                  className="pr-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    data.deviceType === 'celular' 
                      ? (data.imei.length === 15 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-400')
                      : (data.imei.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-400')
                  }`}>
                    {data.imei.length}/{data.deviceType === 'celular' ? 15 : 30}
                  </span>
                </div>
              </div>
            </FormField>

            <FormField label="Evaluación de Estado Físico" error={touched.estadoFisico ? errors.estadoFisico : undefined}>
              <TextArea 
                placeholder="Describe detalles, rayones, partes faltantes o daños visibles..." 
                value={data.estadoFisico} 
                onChange={e => handleChange('estadoFisico', e.target.value)} 
                onBlur={() => handleBlur('estadoFisico')} 
                error={touched.estadoFisico && !!errors.estadoFisico} 
                rows={4} 
                maxLength={300}               />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-sm font-semibold text-surface-900 border-b border-surface-200 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              Detalles de Orden y Presupuesto
            </h3>
            
            <FormField label="Servicio Requerido / Trabajo a Realizar" required error={touched.trabajoRealizar ? errors.trabajoRealizar : undefined}>
              <TextArea 
                placeholder="Explica detalladamente la falla reportada por el cliente y el trabajo técnico a ejecutar..." 
                value={data.trabajoRealizar} 
                onChange={e => handleChange('trabajoRealizar', e.target.value)} 
                onBlur={() => handleBlur('trabajoRealizar')} 
                error={touched.trabajoRealizar && !!errors.trabajoRealizar} 
                rows={5} 
                maxLength={500}              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Costo Total Estimado ($)" error={touched.costoEstimado ? errors.costoEstimado : undefined}>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-bold">$</div>
                   <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={data.costoEstimado} 
                    onChange={e => handleChange('costoEstimado', e.target.value)} 
                    onBlur={() => handleBlur('costoEstimado')} 
                    error={touched.costoEstimado && !!errors.costoEstimado}
                    className="pl-8 text-base font-semibold"
                  />
                </div>
              </FormField>
              <FormField label="Depósito Inicial / Abono ($)" error={touched.abonoInicial ? errors.abonoInicial : undefined}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-bold">$</div>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={data.abonoInicial} 
                    onChange={e => handleChange('abonoInicial', e.target.value)} 
                    onBlur={() => handleBlur('abonoInicial')} 
                    error={touched.abonoInicial && !!errors.abonoInicial} 
                    className="pl-8 text-base font-semibold"
                  />
                </div>
              </FormField>
            </div>

            <div className="bg-surface-900 text-white p-6 rounded-xl mt-8">
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white/60 mb-1">Confirmación de datos</h4>
                    <p className="text-sm text-white/90 leading-relaxed">
                      Se registrará un <span className="font-semibold text-white">{data.deviceType} {data.marca}</span> a nombre de
                      <span className="font-semibold text-white ml-1">{data.nombres} {data.apellidos}</span>.
                      Verificá que los datos sean correctos antes de finalizar el proceso.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-6 border-t border-surface-200 gap-3 mt-8">
          {step > 1 ? (
             <button
              type="button"
              onClick={handlePrev}
              className="px-5 h-11 rounded-lg text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              Regresar
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            type={step === 3 ? "submit" : "button"}
            onClick={step < 3 ? handleNext : undefined}
            disabled={(step < 3 && isNextDisabled) || (step === 3 && (isSaveDisabled || isSubmitting))}
            className={`px-8 h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 ${
              ((step < 3 && isNextDisabled) || (step === 3 && (isSaveDisabled || isSubmitting)))
              ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
              : 'bg-surface-900 text-white hover:bg-surface-800'
            }`}
          >
            {step === 3 ? (
              isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar registro
                </>
              )
            ) : (
              'Siguiente paso'
            )}
          </button>
        </div>
      </form>

      {showSuccessToast && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] animate-fade-in-up">
          <div className="bg-surface-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-full shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Registro completado</p>
              <p className="text-xs text-surface-300 mt-0.5">La orden de servicio se generó con éxito</p>
            </div>
          </div>
        </div>
      )}

      {/* AUTOFILL NOTIFICATION */}
      {showAutofillToast && foundClient && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-surface-900 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5">
            <Users className="w-4 h-4 text-primary-400 shrink-0" />
            <p className="text-sm font-medium truncate">Cliente frecuente: {foundClient.fullName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
