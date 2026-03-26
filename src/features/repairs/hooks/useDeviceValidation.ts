import { useState, useCallback } from 'react';

export interface DeviceFormData {
  // Client Info
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
  
  // Device Info
  deviceType: string;
  marca: string;
  modelo: string;
  imei: string;
  estadoFisico: string;
  trabajoRealizar: string;
  
  // Financials
  costoEstimado: number | '';
  abonoInicial: number | '';
}

export type FormErrors = Partial<Record<keyof DeviceFormData, string>>;

export const initialFormData: DeviceFormData = {
  cedula: '',
  nombres: '',
  apellidos: '',
  telefono: '09',
  email: '',
  direccion: '',
  deviceType: '',
  marca: '',
  modelo: '',
  imei: '',
  estadoFisico: '',
  trabajoRealizar: '',
  costoEstimado: '',
  abonoInicial: '',
};

/**
 * Valida la cédula o RUC ecuatoriano usando el algoritmo de Módulo 10 para cédulas,
 * y validaciones de estructura para RUCs terminados en 001.
 *
 * @param {string} identificacion - El string de la cédula (10 dígitos) o RUC (13 dígitos).
 * @returns {boolean} - true si es válido, false en caso contrario.
 */
export const validateEcuadorianID = (identificacion: string): boolean => {
  if (!identificacion) return false;
  // Solo numéricos
  if (!/^\d+$/.test(identificacion)) return false;

  const isCedula = identificacion.length === 10;
  const isRuc = identificacion.length === 13;

  if (!isCedula && !isRuc) return false;
  if (isRuc && !identificacion.endsWith('001')) return false;

  const provincia = parseInt(identificacion.substring(0, 2), 10);
  if (provincia < 1 || provincia > 22) return false;

  const tercerDigito = parseInt(identificacion.substring(2, 3), 10);
  
  if (isCedula) {
    // Si es cédula, el tercer dígito debe ser menor a 6
    if (tercerDigito >= 6) return false;
    
    // Algoritmo Módulo 10 para cédulas (Persona Natural)
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let valor = parseInt(identificacion.charAt(i), 10) * coeficientes[i];
        if (valor > 9) valor -= 9;
        suma += valor;
    }
    const modulo = suma % 10;
    const digitoVerificador = modulo === 0 ? 0 : 10 - modulo;
    return digitoVerificador === parseInt(identificacion.charAt(9), 10);
  }
  
  if (isRuc) {
    if (tercerDigito < 6) {
        // Persona Natural (primeros 10 dígitos es cedula válida, luego 001)
        return validateEcuadorianID(identificacion.substring(0, 10));
    } else if (tercerDigito === 6) {
        // Entidad Pública - Modulo 11
        const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;
        for (let i = 0; i < 8; i++) {
            suma += parseInt(identificacion.charAt(i), 10) * coeficientes[i];
        }
        const modulo = suma % 11;
        const digitoVerificador = modulo === 0 ? 0 : 11 - modulo;
        return digitoVerificador === parseInt(identificacion.charAt(8), 10);
    } else if (tercerDigito === 9) {
        // Sociedad Privada / Extranjeros - Modulo 11
        const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;
        for (let i = 0; i < 9; i++) {
            suma += parseInt(identificacion.charAt(i), 10) * coeficientes[i];
        }
        const modulo = suma % 11;
        const digitoVerificador = modulo === 0 ? 0 : 11 - modulo;
        return digitoVerificador === parseInt(identificacion.charAt(9), 10);
    }
    return false;
  }

  return false;
};

export const validateEmail = (email: string): boolean => {
  // RFC 2822 standard email validation regex, including edu.ec handling properly
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const useDeviceValidation = () => {
  const [data, setData] = useState<DeviceFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof DeviceFormData, boolean>>>({});

  const validateField = useCallback((name: keyof DeviceFormData, value: string | number): string | undefined => {
    switch (name) {
      case 'cedula':
        if (!value) return 'Requerido';
        if (!validateEcuadorianID(String(value))) return 'Cédula/RUC inválido';
        break;
      case 'nombres':
      case 'apellidos':
      case 'deviceType':
      case 'marca':
      case 'modelo':
      case 'trabajoRealizar':
        if (!value || String(value).trim() === '') return 'Requerido';
        break;
      case 'telefono':
        if (!value) return 'Requerido';
        if (!/^\d{10}$/.test(String(value))) return 'El número debe contener 10 dígitos (Ecuador)';
        break;
      case 'email':
        if (value && !validateEmail(String(value))) return 'Correo electrónico inválido';
        break;
      case 'imei':
        if (value && !/^\d{15}$/.test(String(value))) return 'El IMEI debe tener exactamente 15 dígitos';
        break;
      case 'costoEstimado':
      case 'abonoInicial':
        if (value !== '' && Number(value) < 0) return 'El valor no puede ser negativo';
        break;
    }
    return undefined;
  }, []);

  const handleChange = useCallback((field: keyof DeviceFormData, value: string | number) => {
    let normalizedValue = value;
    if (typeof value === 'string') {
      if (['nombres', 'apellidos', 'marca', 'modelo', 'estadoFisico', 'trabajoRealizar', 'direccion'].includes(field)) {
        normalizedValue = value.toUpperCase();
      } else if (field === 'email') {
        normalizedValue = value.toLowerCase();
      } else if (field === 'cedula' || field === 'imei') {
        normalizedValue = value.replace(/\D/g, '');
      }
    }

    if (field === 'telefono') {
      let val = String(value).replace(/\D/g, '');
      if (val.length > 0 && !val.startsWith('09')) {
        if (val.startsWith('9')) val = '0' + val;
        else val = '09' + val;
      }
      if (val.length > 10) val = val.substring(0, 10);
      normalizedValue = val;
    }

    setData(prev => ({ ...prev, [field]: normalizedValue }));
    const error = validateField(field, normalizedValue);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, [validateField]);

  const handleBlur = useCallback((field: keyof DeviceFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, data[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, [data, validateField]);

  const validateAll = useCallback((fieldsToValidate?: (keyof DeviceFormData)[]) => {
    const newErrors: FormErrors = {};
    let isValid = true;
    const fields = fieldsToValidate || (Object.keys(data) as (keyof DeviceFormData)[]);
    
    for (const key of fields) {
      const error = validateField(key, data[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    
    // Mark validated fields as touched
    const newTouched = { ...touched };
    fields.forEach(f => newTouched[f] = true);
    setTouched(newTouched);
    
    return isValid;
  }, [data, validateField, touched]);

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setData
  };
};
