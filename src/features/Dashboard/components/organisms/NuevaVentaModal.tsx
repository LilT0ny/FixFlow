import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, Loader2, Printer, CheckCircle2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../../components/molecules/Modal';
import { useAppContext } from '../../../../store/AppContext';
import { useSettings } from '../../../../hooks/useSettings';
import { useClienteLookup } from '../../../../hooks/useClienteLookup';
import { printReceipt } from '../../../../utils/printHelpers';
import { useToast } from '../../../../store/ToastContext';
import type { SaleItem, PaymentMethod, CustomerData, DeviceCheckInForm, ServiceOrder } from '../../../../types';

interface NuevaVentaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyItem = (): SaleItem => ({ id: crypto.randomUUID(), description: '', quantity: 1, price: 0 });
const CONSUMIDOR_FINAL: CustomerData = { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', address: '' };

/**
 * Venta directa (repuesto, accesorio) sin pasar por una orden de servicio.
 * Al eliminarse la vista de Notas de Venta, este es el único punto de
 * entrada para ese flujo — vive en el Dashboard, junto al resto de la
 * operación diaria.
 */
export const NuevaVentaModal: React.FC<NuevaVentaModalProps> = ({ isOpen, onClose }) => {
  const { addOrder } = useAppContext();
  const { settings } = useSettings();

  const [customer, setCustomer] = useState<CustomerData>({ fullName: '', documentId: '', phone: '', address: '', email: '' });
  const [items, setItems] = useState<SaleItem[]>([emptyItem()]);
  const [method, setMethod] = useState<PaymentMethod>('efectivo');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ orderNumber: string } | null>(null);
  const { lookup, isSearching: isSearchingClient } = useClienteLookup();
  const { showToast } = useToast();

  const lookupClient = async (cedula: string) => {
    const client = await lookup(cedula);
    if (!client) return;
    setCustomer(prev => ({
      ...prev,
      fullName: client.fullName.toUpperCase(),
      phone: client.phone || prev.phone,
      email: client.email || prev.email,
      address: client.address ? client.address.toUpperCase() : prev.address,
    }));
    showToast('Cliente encontrado — datos actualizados', 'info');
  };

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);

  const reset = () => {
    setCustomer({ fullName: '', documentId: '', phone: '', address: '', email: '' });
    setItems([emptyItem()]);
    setMethod('efectivo');
    setError('');
    setCreated(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300); // esperar a que cierre la animación antes de limpiar
  };

  const updateItem = (id: string, field: keyof SaleItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validItems = items.filter(i => i.description.trim() && i.price > 0);
    if (validItems.length === 0) {
      setError('Agregá al menos un ítem con descripción y precio.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await addOrder({
        customer: customer.documentId.trim() ? customer : CONSUMIDOR_FINAL,
        repair: {
          reportedIssue: validItems.map(i => `${i.quantity}x ${i.description}`).join(', '),
          repairTotalCost: validItems.reduce((s, i) => s + i.quantity * i.price, 0),
          initialDeposit: 0,
          evidencePhotos: [],
        },
        paymentMethod: method,
        items: validItems,
      } as DeviceCheckInForm & { paymentMethod: PaymentMethod; items: SaleItem[] }, 'NT');

      setCreated({ orderNumber: result.orderNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la venta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!created) return;
    const validItems = items.filter(i => i.description.trim() && i.price > 0);
    printReceipt(
      {
        orderNumber: created.orderNumber,
        createdAt: new Date().toISOString(),
        customer: customer.documentId.trim() ? customer : CONSUMIDOR_FINAL,
        // repairTotalCost es lo que printHelpers usa como "VALOR TOTAL" de
        // respaldo cuando no viene `amount`/`total` — debe reflejar la suma real.
        repair: { reportedIssue: '', repairTotalCost: total, evidencePhotos: [] },
        items: validItems,
      } as unknown as ServiceOrder,
      settings.printerType || '80mm',
      'nota-venta',
      false,
      settings
    );
  };

  const inputClass = 'w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader
        title="Nueva venta"
        subtitle="Venta directa de repuestos o accesorios, sin orden de servicio"
        icon={<ShoppingBag className="w-5 h-5" />}
        iconClassName="bg-primary-50 text-primary-600 dark:bg-blue-950/40 dark:text-blue-400"
        onClose={handleClose}
        closeDisabled={isSaving}
      />

      {created ? (
        <>
          <ModalBody className="flex flex-col items-center text-center py-8">
            <div className="w-12 h-12 bg-success-50 text-success-600 rounded-full flex items-center justify-center mb-4 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 mb-1 dark:text-gray-100">Venta registrada</h3>
            <p className="text-sm text-surface-500 dark:text-gray-400">
              Nota <span className="font-mono font-medium text-surface-900 dark:text-gray-100">{created.orderNumber}</span> por ${total.toFixed(2)}
            </p>
          </ModalBody>
          <ModalFooter className="flex-col sm:flex-row">
            <button
              onClick={handleClose}
              className="flex-1 h-11 border border-surface-300 bg-white text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors duration-150 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 h-11 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir nota
            </button>
          </ModalFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">{error}</div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-surface-600 dark:text-gray-400">Cliente (opcional)</label>
                <button
                  type="button"
                  onClick={() => setCustomer(CONSUMIDOR_FINAL)}
                  className="text-xs font-medium bg-surface-100 text-surface-700 px-2.5 py-1 rounded-md hover:bg-surface-200 transition-colors duration-150 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Consumidor final
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className={inputClass}
                  value={customer.fullName}
                  onChange={e => setCustomer({ ...customer, fullName: e.target.value.toUpperCase() })}
                />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cédula / RUC"
                    className={`${inputClass} pr-9`}
                    value={customer.documentId}
                    onChange={e => setCustomer({ ...customer, documentId: e.target.value })}
                    onBlur={() => lookupClient(customer.documentId)}
                  />
                  {isSearchingClient && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>
              <input
                type="email"
                placeholder="Correo electrónico (opcional)"
                className={`${inputClass} mt-3`}
                value={customer.email || ''}
                onChange={e => setCustomer({ ...customer, email: e.target.value.toLowerCase() })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-surface-600 dark:text-gray-400">Ítems</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors duration-150"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar ítem
                </button>
              </div>
              {/* Grid con columnas fijas para Cant./Precio y 1fr para la
                  descripción: así el campo de texto nunca se achica ni se
                  corta, sin importar cuánto escribas en los otros campos. */}
              <div className="hidden sm:grid grid-cols-[3.5rem_minmax(0,1fr)_6.5rem_2.75rem] gap-2 px-0.5 mb-1.5">
                <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wide text-center dark:text-gray-500">Cant.</span>
                <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wide dark:text-gray-500">Descripción</span>
                <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wide text-right dark:text-gray-500">Precio</span>
                <span />
              </div>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_6.5rem_2.75rem] gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      aria-label="Cantidad"
                      className={`${inputClass} text-center px-1`}
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                    />
                    <input
                      type="text"
                      placeholder="Repuesto o servicio..."
                      aria-label="Descripción"
                      className={`${inputClass} min-w-0`}
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      aria-label="Precio"
                      className={`${inputClass} text-right px-2`}
                      value={item.price || ''}
                      onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="h-[42px] w-[42px] shrink-0 flex items-center justify-center text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-150 disabled:opacity-30 disabled:pointer-events-none dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                      title="Quitar ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-600 mb-2 dark:text-gray-400">Método de pago</label>
              <div className="grid grid-cols-2 gap-3">
                {(['efectivo', 'transferencia'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-2.5 px-4 text-sm font-medium capitalize rounded-lg border transition-colors duration-150 ${
                      method === m ? 'bg-surface-900 text-white border-surface-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="items-center justify-between">
            <div className="text-left mr-auto">
              <span className="block text-xs text-surface-500 dark:text-gray-400">Total</span>
              <span className="text-xl font-semibold text-surface-900 tracking-tight dark:text-gray-100">${total.toFixed(2)}</span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar venta'}
            </button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};
