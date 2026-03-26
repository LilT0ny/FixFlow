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
    <div className="w-full max-w-2xl mx-auto bg-white shadow-2xl shadow-surface-200/50 rounded-[40px] border border-surface-100/50 p-8 md:p-12 relative overflow-hidden animate-zoom-in">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-10"></div>
      
      <div className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mb-2 block">Cuestionario</span>
            <h2 className="text-3xl font-black text-surface-900 tracking-tight">Registro de Ingreso</h2>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">Progreso</span>
             <span className="text-lg font-black text-surface-900 tracking-tighter">Paso {step} <span className="text-surface-300 font-bold mx-0.5">/</span> 3</span>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <div className={`h-2.5 flex-1 rounded-full transition-all duration-500 shadow-sm ${step >= 1 ? 'bg-primary-600' : 'bg-surface-100'}`} />
          <div className={`h-2.5 flex-1 rounded-full transition-all duration-500 shadow-sm ${step >= 2 ? 'bg-primary-600' : 'bg-surface-100'}`} />
          <div className={`h-2.5 flex-1 rounded-full transition-all duration-500 shadow-sm ${step >= 3 ? 'bg-primary-600' : 'bg-surface-100'}`} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-50 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Datos del Propietario
            </h3>
            
            <FormField label="Número de Identificación (Cédula/RUC)" required error={touched.cedula ? errors.cedula : undefined}>
              <div className="relative group">
                <Input 
                  placeholder="Escribe la identificación..." 
                  value={data.cedula} 
                  onChange={e => handleChange('cedula', e.target.value)} 
                  onBlur={() => handleBlur('cedula')} 
                  error={touched.cedula && !!errors.cedula} 
                  maxLength={13} 
                  className="pl-4 pr-12 py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold"
                  disabled={isValidatingCedula} 
                />
                {isValidatingCedula && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {!isValidatingCedula && data.cedula.length >= 10 && !errors.cedula && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nombres Completos" required error={touched.nombres ? errors.nombres : undefined}>
                <Input 
                  placeholder="Ej: Juan Antonio" 
                  value={data.nombres} 
                  onChange={e => handleChange('nombres', e.target.value)} 
                  onBlur={() => handleBlur('nombres')} 
                  error={touched.nombres && !!errors.nombres}
                  className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold"
                />
              </FormField>
              <FormField label="Apellidos Completos" required error={touched.apellidos ? errors.apellidos : undefined}>
                <Input 
                  placeholder="Ej: Pérez García" 
                  value={data.apellidos} 
                  onChange={e => handleChange('apellidos', e.target.value)} 
                  onBlur={() => handleBlur('apellidos')} 
                  error={touched.apellidos && !!errors.apellidos} 
                  className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Teléfono / WhatsApp" required error={touched.telefono ? errors.telefono : undefined}>
                <div className="relative">
                  <Input 
                    placeholder="0987-654-321" 
                    value={data.telefono} 
                    onChange={e => handleChange('telefono', e.target.value)} 
                    onBlur={() => handleBlur('telefono')} 
                    error={touched.telefono && !!errors.telefono} 
                    maxLength={10} 
                    className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-black tracking-widest pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${data.telefono.length === 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-400'}`}>
                      {data.telefono.length}/10
                    </span>
                  </div>
                </div>
              </FormField>
              <FormField label="Correo de Contacto" error={touched.email ? errors.email : undefined}>
                <Input 
                  type="email" 
                  placeholder="usuario@ejemplo.com" 
                  value={data.email} 
                  onChange={e => handleChange('email', e.target.value)} 
                  onBlur={() => handleBlur('email')} 
                  error={touched.email && !!errors.email} 
                  className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold"
                />
              </FormField>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-50 pb-3 flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4 text-primary-500" />
              Especificaciones de Hardware
            </h3>
            
            <FormField label="Categoría de Dispositivo" required error={touched.deviceType ? errors.deviceType : undefined}>
              <Select 
                value={data.deviceType} 
                onChange={e => handleChange('deviceType', e.target.value)} 
                onBlur={() => handleBlur('deviceType')} 
                error={touched.deviceType && !!errors.deviceType}
                className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold appearance-none"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                <option value="celular">Celular / Smartphone</option>
                <option value="laptop">Computadora Portátil / Laptop</option>
                <option value="tablet">Tablet / iPad</option>
                <option value="impresora">Impresora / Multifunción</option>
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
                  error={touched.marca && !!errors.marca}
                  className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold"
                />
              </FormField>
              <FormField label="Modelo Específico" required error={touched.modelo ? errors.modelo : undefined}>
                <Input 
                  placeholder="Ej: Galaxy S24 Ultra, MacBook Pro..." 
                  value={data.modelo} 
                  onChange={e => handleChange('modelo', e.target.value)} 
                  onBlur={() => handleBlur('modelo')} 
                  error={touched.modelo && !!errors.modelo}
                  className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-bold"
                />
              </FormField>
            </div>

            <FormField label="Número de Serie / IMEI" error={touched.imei ? errors.imei : undefined}>
              <Input 
                placeholder="Ingresa el identificador único del equipo..." 
                value={data.imei} 
                onChange={e => handleChange('imei', e.target.value)} 
                onBlur={() => handleBlur('imei')} 
                error={touched.imei && !!errors.imei} 
                maxLength={30} 
                className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-black tracking-widest"
              />
            </FormField>

            <FormField label="Evaluación de Estado Físico" error={touched.estadoFisico ? errors.estadoFisico : undefined}>
              <TextArea 
                placeholder="Describe detalles, rayones, partes faltantes o daños visibles..." 
                value={data.estadoFisico} 
                onChange={e => handleChange('estadoFisico', e.target.value)} 
                onBlur={() => handleBlur('estadoFisico')} 
                error={touched.estadoFisico && !!errors.estadoFisico} 
                rows={4} 
                maxLength={300} 
                className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-medium leading-relaxed"
              />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h3 className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-50 pb-3 flex items-center gap-2">
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
                maxLength={500}
                className="py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-sm font-medium leading-relaxed"
              />
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
                    className="pl-8 py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-lg font-black tracking-tight"
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
                    className="pl-8 py-3.5 rounded-2xl border-surface-200 focus:ring-primary-500 bg-surface-50/50 hover:bg-white transition-all text-lg font-black tracking-tight"
                  />
                </div>
              </FormField>
            </div>

            <div className="bg-surface-900 text-white p-6 rounded-[32px] mt-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Confirmación de Datos</h4>
                    <p className="text-xs font-medium text-white/90 leading-relaxed">
                      Se registrará un <span className="font-black text-white">{data.deviceType} {data.marca}</span> a nombre de 
                      <span className="font-black text-white ml-1">{data.nombres} {data.apellidos}</span>. 
                      Verifica que los datos sean correctos antes de finalizar el proceso.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-10 border-t border-surface-50 gap-4 mt-12">
          {step > 1 ? (
             <button
              type="button"
              onClick={handlePrev}
              className="px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-surface-400 hover:bg-surface-50 transition-all active:scale-95 flex items-center gap-2"
            >
              Regresar
            </button>
          ) : (
            <div />
          )}
          
          <button
            type={step === 3 ? "submit" : "button"}
            onClick={step < 3 ? handleNext : undefined}
            disabled={(step < 3 && isNextDisabled) || (step === 3 && (isSaveDisabled || isSubmitting))}
            className={`px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 ${
              ((step < 3 && isNextDisabled) || (step === 3 && (isSaveDisabled || isSubmitting)))
              ? 'bg-surface-100 text-surface-300 cursor-not-allowed border-none shadow-none'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'
            }`}
          >
            {step === 3 ? (
              isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Finalizar Registro
                </>
              )
            ) : (
              'Siguiente Paso'
            )}
          </button>
        </div>
      </form>

      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 z-[100] animate-in fade-in slide-in-from-bottom-12 duration-500">
          <div className="bg-surface-950 text-white px-8 py-5 rounded-[28px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex items-center gap-5 border border-surface-800 backdrop-blur-xl">
            <div className="bg-emerald-500 p-2.5 rounded-full shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-sm tracking-tight">Registro Completado</p>
              <p className="text-[11px] text-surface-400 font-bold uppercase tracking-widest mt-1">Orden de servicio generada con éxito</p>
            </div>
          </div>
        </div>
      )}

      {/* AUTOFILL NOTIFICATION */}
      {showAutofillToast && foundClient && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-12 duration-700">
          <div className="bg-primary-600/90 text-white backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-primary-400/50">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest">Cliente frecuente: {foundClient.fullName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
