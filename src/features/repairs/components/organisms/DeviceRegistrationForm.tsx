import { useState, useMemo } from 'react';
import { useDeviceValidation } from '../../hooks/useDeviceValidation';
import { Input } from '../../../../components/atoms/Input';
import { TextArea } from '../../../../components/atoms/TextArea';
import { Select } from '../../../../components/atoms/Select';
import { Button } from '../../../../components/atoms/Button';
import { FormField } from '../../../../components/molecules/FormField';
import { Card } from '../../../../components/atoms/Card';

import type { DeviceCheckInForm } from '../../../../types';

interface TitleProps {
  onSave?: (data: DeviceCheckInForm) => void;
  estaEnviando?: boolean;
}


export const DeviceRegistrationForm = ({ onSave, estaEnviando }: TitleProps) => {
  const [step, setStep] = useState(1);
  const { data, errors, touched, handleChange, handleBlur, validateAll } = useDeviceValidation();

  const handleNext = () => {
    let fieldsToValidate: (keyof typeof data)[] = [];
    if (step === 1) {
      fieldsToValidate = ['cedula', 'nombres', 'apellidos', 'telefono', 'email'];
    } else if (step === 2) {
      fieldsToValidate = ['marca', 'modelo', 'imei', 'estadoFisico', 'trabajoRealizar'];
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
            phone: data.countryCode + data.telefono,
            email: data.email
          },
          device: {
            brand: data.marca,
            model: data.modelo,
            serialNumber: data.imei,
            deviceType: 'celular',
            physicalCondition: data.estadoFisico
          },
          repair: {
            reportedIssue: data.trabajoRealizar,
            evidencePhotos: [],
            initialDeposit: data.abonoInicial,
            repairTotalCost: data.costoEstimado
          }
        });
      } else {
        alert('Registro guardado exitosamente: \n' + JSON.stringify(data, null, 2));
      }
    }
  };

  // Check if step is valid
  const isStep1Valid = useMemo(() => {
    const hasErrors = !!(errors.cedula || errors.nombres || errors.apellidos || errors.telefono || errors.email);
    const hasEmpties = !data.cedula || !data.nombres || !data.apellidos || !data.telefono;
    return !hasErrors && !hasEmpties;
  }, [data, errors]);

  const isStep2Valid = useMemo(() => {
    const hasErrors = !!(errors.marca || errors.modelo || errors.imei || errors.estadoFisico || errors.trabajoRealizar);
    const hasEmpties = !data.marca || !data.modelo || !data.trabajoRealizar;
    return !hasErrors && !hasEmpties;
  }, [data, errors]);

  const isStep3Valid = useMemo(() => {
    const hasErrors = !!(errors.costoEstimado || errors.abonoInicial);
    return !hasErrors;
  }, [errors]);

  const isNextDisabled = (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid);
  const isSaveDisabled = step === 3 && !isStep3Valid;

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
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
        {/* Paso 1: Información del Cliente */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-800 border-b pb-2">Información del Cliente</h3>
            
            <FormField
              label="Cédula / RUC"
              required
              error={touched.cedula ? errors.cedula : undefined}
              charCount={data.cedula.length}
              maxChars={13}
            >
              <Input
                placeholder="10 dígitos (Cédula) o 13 (RUC)"
                value={data.cedula}
                onChange={e => handleChange('cedula', e.target.value)}
                onBlur={() => handleBlur('cedula')}
                error={touched.cedula && !!errors.cedula}
                maxLength={13}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nombres"
                required
                error={touched.nombres ? errors.nombres : undefined}
              >
                <Input
                  placeholder="Ej: Juan"
                  value={data.nombres}
                  onChange={e => handleChange('nombres', e.target.value)}
                  onBlur={() => handleBlur('nombres')}
                  error={touched.nombres && !!errors.nombres}
                />
              </FormField>

              <FormField
                label="Apellidos"
                required
                error={touched.apellidos ? errors.apellidos : undefined}
              >
                <Input
                  placeholder="Ej: Pérez"
                  value={data.apellidos}
                  onChange={e => handleChange('apellidos', e.target.value)}
                  onBlur={() => handleBlur('apellidos')}
                  error={touched.apellidos && !!errors.apellidos}
                />
              </FormField>
            </div>

            <FormField
              label="Teléfono"
              required
              error={touched.telefono ? errors.telefono : undefined}
            >
              <div className="flex gap-2">
                <div className="w-1/3">
                  <Select
                    value={data.countryCode}
                    onChange={e => handleChange('countryCode', e.target.value)}
                  >
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+51">🇵🇪 +51</option>
                  </Select>
                </div>
                <div className="w-2/3">
                  <Input
                    placeholder="9 dígitos"
                    value={data.telefono}
                    onChange={e => handleChange('telefono', e.target.value)}
                    onBlur={() => handleBlur('telefono')}
                    error={touched.telefono && !!errors.telefono}
                    maxLength={9}
                  />
                </div>
              </div>
            </FormField>

            <FormField
              label="Correo Electrónico"
              error={touched.email ? errors.email : undefined}
            >
              <Input
                type="email"
                placeholder="Ej: usuario@edu.ec"
                value={data.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={touched.email && !!errors.email}
              />
            </FormField>
          </div>
        )}

        {/* Paso 2: Información del Dispositivo */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-800 border-b pb-2">Información del Dispositivo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Marca"
                required
                error={touched.marca ? errors.marca : undefined}
              >
                <Input
                  placeholder="Ej: Samsung"
                  value={data.marca}
                  onChange={e => handleChange('marca', e.target.value)}
                  onBlur={() => handleBlur('marca')}
                  error={touched.marca && !!errors.marca}
                />
              </FormField>

              <FormField
                label="Modelo"
                required
                error={touched.modelo ? errors.modelo : undefined}
              >
                <Input
                  placeholder="Ej: Galaxy S23"
                  value={data.modelo}
                  onChange={e => handleChange('modelo', e.target.value)}
                  onBlur={() => handleBlur('modelo')}
                  error={touched.modelo && !!errors.modelo}
                />
              </FormField>
            </div>

            <FormField
              label="IMEI (Opcional)"
              error={touched.imei ? errors.imei : undefined}
              charCount={data.imei.length}
              maxChars={15}
            >
              <Input
                placeholder="15 dígitos exactos"
                value={data.imei}
                onChange={e => handleChange('imei', e.target.value)}
                onBlur={() => handleBlur('imei')}
                error={touched.imei && !!errors.imei}
                maxLength={15}
              />
            </FormField>

            <FormField
              label="Estado Físico del Dispositivo"
              error={touched.estadoFisico ? errors.estadoFisico : undefined}
              charCount={data.estadoFisico.length}
              maxChars={200}
            >
              <TextArea
                placeholder="Ej: Pantalla rota, sin botones laterales..."
                value={data.estadoFisico}
                onChange={e => handleChange('estadoFisico', e.target.value)}
                onBlur={() => handleBlur('estadoFisico')}
                error={touched.estadoFisico && !!errors.estadoFisico}
                rows={3}
                maxLength={200}
              />
            </FormField>

            <FormField
              label="Trabajo a Realizar"
              required
              error={touched.trabajoRealizar ? errors.trabajoRealizar : undefined}
              charCount={data.trabajoRealizar.length}
              maxChars={300}
            >
              <TextArea
                placeholder="Ej: Cambio de pantalla y batería..."
                value={data.trabajoRealizar}
                onChange={e => handleChange('trabajoRealizar', e.target.value)}
                onBlur={() => handleBlur('trabajoRealizar')}
                error={touched.trabajoRealizar && !!errors.trabajoRealizar}
                rows={4}
                maxLength={300}
              />
            </FormField>
          </div>
        )}

        {/* Paso 3: Costos y Confirmación */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-surface-800 border-b pb-2">Costos y Confirmación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Costo Estimado ($)"
                error={touched.costoEstimado ? errors.costoEstimado : undefined}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={data.costoEstimado}
                  onChange={e => handleChange('costoEstimado', e.target.value)}
                  onBlur={() => handleBlur('costoEstimado')}
                  error={touched.costoEstimado && !!errors.costoEstimado}
                />
              </FormField>

              <FormField
                label="Abono Inicial ($)"
                error={touched.abonoInicial ? errors.abonoInicial : undefined}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={data.abonoInicial}
                  onChange={e => handleChange('abonoInicial', e.target.value)}
                  onBlur={() => handleBlur('abonoInicial')}
                  error={touched.abonoInicial && !!errors.abonoInicial}
                />
              </FormField>
            </div>

            <div className="bg-primary-50 p-4 rounded-xl mt-6 border border-primary-100">
              <p className="text-sm text-primary-900">
                <strong>Resumen:</strong> El equipo {data.marca} {data.modelo} será registrado a nombre de {data.nombres} {data.apellidos}.
                Revisa los datos antes de guardar.
              </p>
            </div>
          </div>
        )}

        {/* Botones de Navegación */}
        <div className="flex justify-between pt-6 border-t mt-8">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
            >
              Anterior
            </Button>
          ) : (
            <div></div> // Espaciador
          )}
          
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled}
              className={isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSaveDisabled || estaEnviando}
              className={isSaveDisabled || estaEnviando ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {estaEnviando ? 'Guardando...' : 'Guardar Registro'}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};
