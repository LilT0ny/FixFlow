import { useState, useMemo } from 'react';
import { useDeviceValidation } from '../../hooks/useDeviceValidation';
import { useClienteLookup } from '../../../../hooks/useClienteLookup';
import { Input } from '../../../../components/atoms/Input';
import { TextArea } from '../../../../components/atoms/TextArea';
import { Select } from '../../../../components/atoms/Select';
import { FormField } from '../../../../components/molecules/FormField';
import { Loader2, CheckCircle2, User, MonitorSmartphone, Wallet, Check } from 'lucide-react';
import { useToast } from '../../../../store/ToastContext';

import type { DeviceCheckInForm } from '../../../../types';

interface TitleProps {
  onSave?: (data: DeviceCheckInForm) => void;
  isSubmitting?: boolean;
}

const STEPS = [
  { n: 1, label: 'Cliente', icon: User },
  { n: 2, label: 'Equipo', icon: MonitorSmartphone },
  { n: 3, label: 'Presupuesto', icon: Wallet },
];

export const DeviceRegistrationForm = ({ onSave, isSubmitting }: TitleProps) => {
  const [step, setStep] = useState(1);
  const { data, errors, touched, handleChange, handleBlur, validateAll, setData } = useDeviceValidation();

  // Búsqueda de cliente existente por documento (al salir del campo)
  const { lookup, isSearching: isSearchingClient } = useClienteLookup();
  const { showToast } = useToast();

  const lookupClient = async (cedula: string) => {
    const client = await lookup(cedula);
    if (!client) return;

    const nameParts = client.fullName.split(' ');
    const nombres = nameParts[0] || '';
    const apellidos = nameParts.slice(1).join(' ') || '';

    let phone = client.phone || '';
    if (phone.startsWith('+593')) phone = '0' + phone.substring(4);
    if (phone.startsWith('593')) phone = '0' + phone.substring(3);

    setData(prev => ({
      ...prev,
      nombres: nombres.toUpperCase(),
      apellidos: apellidos.toUpperCase(),
      telefono: phone,
      email: client.email ? client.email.toLowerCase() : prev.email,
      direccion: client.address ? client.address.toUpperCase() : prev.direccion
    }));

    showToast(`Cliente frecuente: ${client.fullName}`, 'info');
  };

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

  const handlePrev = () => setStep(prev => Math.max(1, prev - 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll() && onSave) {
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
    }
  };

  const isStep1Valid = useMemo(() => {
    const hasErrors = !!(errors.cedula || errors.nombres || errors.apellidos || errors.telefono || errors.email);
    const hasEmpties = !data.cedula || !data.nombres || !data.apellidos || !data.telefono;
    return !hasErrors && !hasEmpties && !isSearchingClient;
  }, [data, errors, isSearchingClient]);

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

  const total = Number(data.costoEstimado) || 0;
  const abono = Number(data.abonoInicial) || 0;
  const saldo = Math.max(0, total - abono);

  return (
    <div className="relative animate-fade-in-up max-w-3xl mx-auto">

      {/* ─── Stepper con etapas nombradas ─── */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const isDone = step > s.n;
            const isCurrent = step === s.n;
            return (
              <div key={s.n} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => isDone && setStep(s.n)}
                  disabled={!isDone}
                  className={`flex items-center gap-2.5 ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                  title={isDone ? `Volver a ${s.label}` : s.label}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                    isDone
                      ? 'bg-surface-900 border-surface-900 text-white dark:bg-gray-100 dark:border-gray-100 dark:text-gray-900'
                      : isCurrent
                        ? 'bg-white border-surface-900 text-surface-900 dark:bg-gray-900 dark:border-gray-100 dark:text-gray-100'
                        : 'bg-white border-surface-200 text-surface-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-600'
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </span>
                  <span className={`text-sm font-medium hidden sm:block ${
                    isCurrent ? 'text-surface-900 dark:text-gray-100' : isDone ? 'text-surface-600 dark:text-gray-400' : 'text-surface-300 dark:text-gray-600'
                  }`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 sm:mx-4 transition-colors duration-500 ${step > s.n ? 'bg-surface-900 dark:bg-gray-100' : 'bg-surface-200 dark:bg-gray-800'}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="sm:hidden text-sm font-medium text-surface-900 mt-3 dark:text-gray-100">
          Paso {step} de 3 · {STEPS[step - 1].label}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ─── Paso 1: Cliente ─── */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
            <FormField label="Documento de identidad (cédula, RUC o pasaporte)" required error={touched.cedula ? errors.cedula : undefined}>
              <div className="relative">
                <Input
                  placeholder="Ej: 1712345678, V-12345678..."
                  value={data.cedula}
                  onChange={e => handleChange('cedula', e.target.value)}
                  onBlur={() => { handleBlur('cedula'); lookupClient(data.cedula); }}
                  error={touched.cedula && !!errors.cedula}
                  maxLength={20}
                  className="pr-10"
                  disabled={isSearchingClient}
                />
                {isSearchingClient && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-surface-400 mt-1.5 dark:text-gray-500">
                Si el cliente ya existe, sus datos se completan automáticamente.
              </p>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Nombres" required error={touched.nombres ? errors.nombres : undefined}>
                <Input
                  placeholder="Ej: Juan Antonio"
                  value={data.nombres}
                  onChange={e => handleChange('nombres', e.target.value)}
                  onBlur={() => handleBlur('nombres')}
                  error={touched.nombres && !!errors.nombres}
                />
              </FormField>
              <FormField label="Apellidos" required error={touched.apellidos ? errors.apellidos : undefined}>
                <Input
                  placeholder="Ej: Pérez García"
                  value={data.apellidos}
                  onChange={e => handleChange('apellidos', e.target.value)}
                  onBlur={() => handleBlur('apellidos')}
                  error={touched.apellidos && !!errors.apellidos}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Teléfono / WhatsApp" required error={touched.telefono ? errors.telefono : undefined}>
                <Input
                  placeholder="09..."
                  value={data.telefono}
                  onChange={e => handleChange('telefono', e.target.value)}
                  onBlur={() => handleBlur('telefono')}
                  error={touched.telefono && !!errors.telefono}
                  maxLength={10}
                />
              </FormField>
              <FormField label="Correo electrónico (opcional)" error={touched.email ? errors.email : undefined}>
                <Input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={data.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={touched.email && !!errors.email}
                />
              </FormField>
            </div>

            <FormField label="Dirección / Referencia (opcional)" error={touched.direccion ? errors.direccion : undefined}>
              <Input
                placeholder="Sector / Calle..."
                value={data.direccion}
                onChange={e => handleChange('direccion', e.target.value)}
                onBlur={() => handleBlur('direccion')}
                error={touched.direccion && !!errors.direccion}
              />
            </FormField>
          </div>
        )}

        {/* ─── Paso 2: Equipo ─── */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Tipo de equipo" required error={touched.deviceType ? errors.deviceType : undefined}>
                <Select
                  value={data.deviceType}
                  onChange={e => handleChange('deviceType', e.target.value)}
                  onBlur={() => handleBlur('deviceType')}
                  error={touched.deviceType && !!errors.deviceType}
                >
                  <option value="" disabled>Selecciona...</option>
                  <option value="celular">Celular / Smartphone</option>
                  <option value="laptop">Laptop</option>
                  <option value="tablet">Tablet / iPad</option>
                  <option value="impresora">Impresora</option>
                  <option value="tv">Televisor / Smart TV</option>
                  <option value="lavadora">Lavadora / Secadora</option>
                  <option value="refrigerador">Refrigerador</option>
                  <option value="microondas">Microondas</option>
                  <option value="cocina">Cocina / Horno</option>
                  <option value="calefon">Calefón</option>
                  <option value="plancha">Plancha</option>
                  <option value="licuadora">Licuadora</option>
                  <option value="otro">Otro</option>
                </Select>
              </FormField>
              <FormField
                label={data.deviceType === 'celular' ? 'IMEI (opcional)' : 'Número de serie (opcional)'}
                error={touched.imei ? errors.imei : undefined}
              >
                <Input
                  placeholder={data.deviceType === 'celular' ? 'IMEI de 15 dígitos' : 'Serial del equipo'}
                  value={data.imei}
                  onChange={e => handleChange('imei', e.target.value)}
                  onBlur={() => handleBlur('imei')}
                  error={touched.imei && !!errors.imei}
                  maxLength={data.deviceType === 'celular' ? 15 : 30}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Marca" required error={touched.marca ? errors.marca : undefined}>
                <Input
                  placeholder="Ej: Apple, Samsung, Dell..."
                  value={data.marca}
                  onChange={e => handleChange('marca', e.target.value)}
                  onBlur={() => handleBlur('marca')}
                  error={touched.marca && !!errors.marca}
                />
              </FormField>
              <FormField label="Modelo" required error={touched.modelo ? errors.modelo : undefined}>
                <Input
                  placeholder="Ej: Galaxy S24, MacBook Pro..."
                  value={data.modelo}
                  onChange={e => handleChange('modelo', e.target.value)}
                  onBlur={() => handleBlur('modelo')}
                  error={touched.modelo && !!errors.modelo}
                />
              </FormField>
            </div>

            <FormField label="Estado físico al ingresar (opcional)" error={touched.estadoFisico ? errors.estadoFisico : undefined}>
              <TextArea
                placeholder="Rayones, partes faltantes o daños visibles..."
                value={data.estadoFisico}
                onChange={e => handleChange('estadoFisico', e.target.value)}
                onBlur={() => handleBlur('estadoFisico')}
                error={touched.estadoFisico && !!errors.estadoFisico}
                rows={3}
                maxLength={300}
              />
            </FormField>
          </div>
        )}

        {/* ─── Paso 3: Presupuesto ─── */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
            <FormField label="Falla reportada / Trabajo a realizar" required error={touched.trabajoRealizar ? errors.trabajoRealizar : undefined}>
              <TextArea
                placeholder="Describe la falla que reporta el cliente y el trabajo técnico a ejecutar..."
                value={data.trabajoRealizar}
                onChange={e => handleChange('trabajoRealizar', e.target.value)}
                onBlur={() => handleBlur('trabajoRealizar')}
                error={touched.trabajoRealizar && !!errors.trabajoRealizar}
                rows={4}
                maxLength={500}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Costo total ($)" error={touched.costoEstimado ? errors.costoEstimado : undefined}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-bold dark:text-gray-500">$</div>
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
              <FormField label="Abono inicial ($)" error={touched.abonoInicial ? errors.abonoInicial : undefined}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-bold dark:text-gray-500">$</div>
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

            {/* Resumen en vivo */}
            <div className="bg-surface-900 text-white rounded-xl p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <span className="block text-xs text-white/50 mb-1">Total</span>
                  <span className="text-lg font-semibold tracking-tight">${total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-xs text-white/50 mb-1">Abono</span>
                  <span className="text-lg font-semibold tracking-tight text-emerald-400">${abono.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-xs text-white/50 mb-1">Saldo pendiente</span>
                  <span className="text-lg font-semibold tracking-tight">${saldo.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-sm text-white/80 leading-relaxed">
                Se registrará <span className="font-semibold text-white">{data.marca || '—'} {data.modelo || ''}</span> a nombre de
                <span className="font-semibold text-white ml-1">{data.nombres} {data.apellidos}</span>.
                Al finalizar se imprime el ticket de ingreso.
              </div>
            </div>
          </div>
        )}

        {/* ─── Navegación ─── */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center pt-6 border-t border-surface-200 gap-3 mt-8 dark:border-gray-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 h-11 rounded-lg text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-150 flex items-center justify-center gap-2 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            >
              Regresar
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <button
            type={step === 3 ? 'submit' : 'button'}
            onClick={step < 3 ? handleNext : undefined}
            disabled={(step < 3 && isNextDisabled) || (step === 3 && (isSaveDisabled || isSubmitting))}
            className={`px-8 h-11 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 ${
              ((step < 3 && isNextDisabled) || (step === 3 && (isSaveDisabled || isSubmitting)))
                ? 'bg-surface-100 text-surface-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
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
              `Continuar a ${STEPS[step].label}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
