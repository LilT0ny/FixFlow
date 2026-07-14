import React, { useState, useEffect } from 'react';
import { User, Smartphone, Wrench, DollarSign, Loader2, Save, AlertCircle } from 'lucide-react';
import type { ServiceOrder } from '../../../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/molecules/Modal';
import { useClienteLookup } from '../../../../hooks/useClienteLookup';
import { useToast } from '../../../../store/ToastContext';

interface EditOrderModalProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: ServiceOrder) => Promise<void>;
}

// ─── Utilidades de Validación ────────────────────────────────────────────────

/** Convierte a mayúsculas (excepto email) */
const toUpper = (val: string) => val.toUpperCase();

/**
 * Valida el formato de teléfono: empieza con 0 (Ecuador local) o +593 / 593.
 * Longitud mínima 7 dígitos (extensiones), máx 15.
 */
function validarTelefono(tel: string): boolean {
  const clean = tel.replace(/[\s\-()]/g, '');
  return /^(\+?593|0)\d{7,12}$/.test(clean);
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Modal de edición completa de una orden de servicio.
 * - AUTO-MAYÚSCULAS en todos los campos excepto email.
 * - Sin validación de formato de cédula (clientes extranjeros, sin ID conocido).
 * - Validación de formato de teléfono (+593 / 09XXXXXXXX).
 * - Costos no pueden ser negativos; Abono ≤ Costo Total.
 */
export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose, onSave }) => {
  const [draft,    setDraft]    = useState<ServiceOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const { lookup, isSearching: isSearchingClient } = useClienteLookup();
  const { showToast } = useToast();

  // Clonar la orden cuando se abre el modal (evitar mutación del original)
  useEffect(() => {
    if (order) setDraft(JSON.parse(JSON.stringify(order)));
  }, [order]);

  if (!draft) return null;

  const lookupClient = async (cedula: string) => {
    const client = await lookup(cedula);
    if (!client) return;
    setDraft(prev => prev ? {
      ...prev,
      customer: {
        ...prev.customer,
        fullName: client.fullName.toUpperCase(),
        phone: client.phone || prev.customer.phone,
        email: client.email || prev.customer.email,
        address: client.address ? client.address.toUpperCase() : prev.customer.address,
      }
    } : null);
    showToast('Cliente encontrado — datos actualizados', 'info');
  };

  // ── Helpers de mutación del borrador ────────────────────────────────────
  const setCustomer = (field: keyof ServiceOrder['customer'], value: string) => {
    setErrors(e => ({ ...e, [field]: '' }));
    setDraft(prev => prev ? {
      ...prev,
      customer: { ...prev.customer, [field]: field === 'email' ? value : toUpper(value) }
    } : null);
  };

  const setDevice = (field: keyof NonNullable<ServiceOrder['device']>, value: string) => {
    setDraft(prev => {
      if (!prev) return null;
      const currentDevice = prev.device || {
        brand: '', model: '', serialNumber: '', deviceType: 'celular', physicalCondition: ''
      };
      return {
        ...prev,
        device: { ...currentDevice, [field]: toUpper(value) }
      };
    });
  };

  const setRepair = (field: 'reportedIssue' | 'repairTotalCost' | 'initialDeposit', value: string | number) => {
    setErrors(e => ({ ...e, [field]: '' }));
    setDraft(prev => {
      if (!prev) return null;
      const newVal = field === 'reportedIssue' && typeof value === 'string' ? toUpper(value) : value;
      return { ...prev, repair: { ...prev.repair, [field]: newVal } };
    });
  };

  // ── Validación antes de guardar ─────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!draft.customer.fullName.trim()) {
      newErrors.fullName = 'El nombre es obligatorio.';
    }

    if (!draft.customer.documentId.trim()) {
      newErrors.documentId = 'La identificación es obligatoria.';
    }

    const isSale = draft.orderNumber.startsWith('NT');

    // Solo validar teléfono si no es venta rápida o si se ingresó algo
    if (draft.customer.phone && !validarTelefono(draft.customer.phone)) {
      newErrors.phone = 'Teléfono inválido. Usa formato 09XXXXXXXX o +593XXXXXXXXX.';
    }

    const total = Number(draft.repair.repairTotalCost) || 0;
    const abono = Number(draft.repair.initialDeposit)  || 0;
    if (total < 0) newErrors.repairTotalCost = 'El costo no puede ser negativo.';
    if (abono < 0) newErrors.initialDeposit  = 'El abono no puede ser negativo.';
    
    if (!isSale && abono > total && total > 0) {
      newErrors.initialDeposit = 'El abono no puede superar el costo total.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!draft || !validate()) return;
    setIsSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch {
      // El error ya fue alertado en useOrders
    } finally {
      setIsSaving(false);
    }
  };

  // ── Clases reutilizables ─────────────────────────────────────────────────
  const inputBase = 'w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 transition-colors duration-150 placeholder-surface-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500';
  const inputOk   = 'border-surface-300 focus:ring-primary-500/20 focus:border-primary-500 dark:border-gray-700';
  const inputErr  = 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500 dark:border-red-500';
  const ic = (f: string) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  const labelClass   = 'block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400';
  const sectionClass = 'bg-surface-50 rounded-xl p-4 border border-surface-200 space-y-3 dark:bg-gray-900/60 dark:border-gray-800';

  const total = Number(draft.repair.repairTotalCost) || 0;
  const abono = Number(draft.repair.initialDeposit)  || 0;
  const saldo = total - abono;
  const isSale = draft.orderNumber.startsWith('NT');

  const ErrorMsg = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="flex items-center gap-1 text-xs text-danger-600 mt-1">
        <AlertCircle className="w-3 h-3" /> {errors[field]}
      </p>
    ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title={`Editar ${isSale ? 'Nota de Venta' : 'Orden'} #${draft.orderNumber}`}
        subtitle="Los cambios se guardarán en la base de datos."
        icon={<Wrench className="w-5 h-5" />}
        iconClassName="bg-primary-50 text-primary-600 dark:bg-blue-950/40 dark:text-blue-400"
        onClose={onClose}
        closeDisabled={isSaving}
      />

        {/* Body */}
        <ModalBody className="space-y-6">

          {/* ─── DATOS DEL CLIENTE ─── */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-900 mb-3 dark:text-gray-100">
              <User className="w-4 h-4 text-primary-600" />
              Datos del Cliente
            </h4>
            <div className={sectionClass}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nombre Completo *</label>
                  <input
                    type="text"
                    className={ic('fullName') + ' uppercase'}
                    value={draft.customer.fullName}
                    onChange={e => setCustomer('fullName', e.target.value)}
                    placeholder="APELLIDO NOMBRE"
                  />
                  <ErrorMsg field="fullName" />
                </div>
                <div>
                  <label className={labelClass}>Identificación (cédula, RUC o pasaporte) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={ic('documentId') + ' pr-9'}
                      value={draft.customer.documentId}
                      onChange={e => setCustomer('documentId', e.target.value)}
                      onBlur={() => lookupClient(draft.customer.documentId)}
                      placeholder="Ej. 1712345678, V-12345678..."
                      maxLength={20}
                    />
                    {isSearchingClient && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <ErrorMsg field="documentId" />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    type="tel"
                    className={ic('phone')}
                    value={draft.customer.phone}
                    onChange={e => setCustomer('phone', e.target.value)}
                    placeholder="09XXXXXXXX"
                  />
                  <ErrorMsg field="phone" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    className={ic('email')}
                    value={draft.customer.email || ''}
                    onChange={e => setCustomer('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Dirección</label>
                  <input
                    type="text"
                    className={ic('address') + ' uppercase'}
                    value={draft.customer.address || ''}
                    onChange={e => setCustomer('address', e.target.value)}
                    placeholder="CALLE, BARRIO, CIUDAD"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ─── DATOS DEL DISPOSITIVO (SOLO PARA REP O SI NT TIENE UNO) ─── */}
          {(!isSale || draft.device) && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-900 mb-3 dark:text-gray-100">
                <Smartphone className="w-4 h-4 text-primary-600" />
                Datos del Dispositivo
              </h4>
              <div className={sectionClass}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Tipo</label>
                    <select
                      className={ic('deviceType')}
                      title="Seleccionar tipo de dispositivo"
                      value={draft.device?.deviceType || 'celular'}
                      onChange={e => setDevice('deviceType', e.target.value)}
                    >
                      <option value="celular">CELULAR</option>
                      <option value="tablet">TABLET</option>
                      <option value="laptop">LAPTOP</option>
                      <option value="impresora">IMPRESORA</option>
                      <option value="lavadora">LAVADORA / SECADORA</option>
                      <option value="calefon">CALEFÓN / TERMOTANQUE</option>
                      <option value="refrigerador">REFRIGERADOR / NEVERA</option>
                      <option value="microondas">HORNO MICROONDAS</option>
                      <option value="tv">TELEVISOR / SMART TV</option>
                      <option value="cocina">COCINA / HORNO A GAS</option>
                      <option value="plancha">PLANCHA DE ROPA</option>
                      <option value="licuadora">LICUADORA / PROCESADORA</option>
                      <option value="otro">OTRO</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Marca</label>
                    <input
                      type="text"
                      className={ic('brand') + ' uppercase'}
                      value={draft.device?.brand || ''}
                      onChange={e => setDevice('brand', e.target.value)}
                      placeholder="SAMSUNG, APPLE..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Modelo</label>
                    <input
                      type="text"
                      className={ic('model') + ' uppercase'}
                      value={draft.device?.model || ''}
                      onChange={e => setDevice('model', e.target.value)}
                      placeholder="A54, IPHONE 15..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {draft.device?.deviceType === 'celular' ? 'IMEI *' : 'Número de Serie / Serial *'}
                    </label>
                    <input
                      type="text"
                      className={ic('serialNumber')}
                      value={draft.device?.serialNumber || ''}
                      onChange={e => {
                        const val = draft.device?.deviceType === 'celular'
                          ? e.target.value.replace(/\D/g, '').substring(0, 15)
                          : e.target.value.toUpperCase().substring(0, 30);
                        setDevice('serialNumber', val);
                      }}
                      placeholder={draft.device?.deviceType === 'celular' ? "IMEI de 15 dígitos" : "S/N o Serie"}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Estado Físico</label>
                    <input
                      type="text"
                      className={ic('physicalCondition') + ' uppercase'}
                      value={draft.device?.physicalCondition || ''}
                      onChange={e => setDevice('physicalCondition', e.target.value)}
                      placeholder="GOLPES, RAYONES, PANTALLA ROTA..."
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── TRABAJO Y COSTOS ─── */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-900 mb-3 dark:text-gray-100">
              <DollarSign className="w-4 h-4 text-primary-600" />
              {isSale ? 'Detalle de Cobro' : 'Trabajo a Realizar y Costos'}
            </h4>
            <div className={sectionClass}>
              {!isSale && (
                <div>
                  <label className={labelClass}>Falla Reportada / Trabajo *</label>
                  <textarea
                    rows={3}
                    className={ic('reportedIssue') + ' resize-none uppercase'}
                    value={draft.repair.reportedIssue}
                    onChange={e => setRepair('reportedIssue', e.target.value)}
                    placeholder="DESCRIPCIÓN DEL TRABAJO A REALIZAR..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Costo Total ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 dark:text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={ic('repairTotalCost') + ' pl-8'}
                      value={draft.repair.repairTotalCost ?? ''}
                      onChange={e => setRepair('repairTotalCost', e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value)))}
                      placeholder="0.00"
                    />
                  </div>
                  <ErrorMsg field="repairTotalCost" />
                </div>
                <div>
                  <label className={labelClass}>Abono / Anticipo ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 dark:text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={ic('initialDeposit') + ' pl-8'}
                      value={draft.repair.initialDeposit ?? ''}
                      onChange={e => setRepair('initialDeposit', e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value)))}
                      placeholder="0.00"
                    />
                  </div>
                  <ErrorMsg field="initialDeposit" />
                </div>
              </div>

              {/* Saldo calculado en tiempo real */}
              {(total > 0 || abono > 0) && (
                <div className={`flex justify-between items-center rounded-lg px-4 py-2 border ${
                  saldo < 0
                    ? 'bg-danger-50 border-danger-100 dark:bg-red-950/30 dark:border-red-900'
                    : saldo === 0
                    ? 'bg-success-50 border-success-100 dark:bg-emerald-950/30 dark:border-emerald-900'
                    : 'bg-primary-50 border-primary-100 dark:bg-blue-950/30 dark:border-blue-900'
                }`}>
                  <span className="text-sm font-medium text-surface-700 dark:text-gray-300">Saldo pendiente:</span>
                  <span className={`text-base font-semibold ${
                    saldo < 0 ? 'text-danger-700 dark:text-red-400' : saldo === 0 ? 'text-success-700 dark:text-emerald-400' : 'text-primary-700 dark:text-blue-400'
                  }`}>
                    ${saldo.toFixed(2)}
                    {saldo === 0 && ' ✓'}
                    {saldo < 0 && ' ⚠'}
                  </span>
                </div>
              )}
            </div>
          </section>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 border border-surface-300 bg-white text-surface-700 h-11 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors duration-150 disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-surface-900 text-white h-11 rounded-lg text-sm font-medium hover:bg-surface-800 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Save className="w-4 h-4" /> Guardar cambios</>
            }
          </button>
        </ModalFooter>
    </Modal>
  );
};
