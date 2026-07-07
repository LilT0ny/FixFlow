import React, { useState, useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import {
  Plus,
  Printer,
  Search,
  FileText,
  Trash2,
  CheckCircle,
  Loader2,
  X,
  User,
  ShoppingBag,
  Info,
  CreditCard} from 'lucide-react';
import { PrintManager } from '../../components/organisms/PrintManager';
import { PageHeader } from '../../components/design-system';
import type { ServiceOrder } from '../../types';
import type { OrderCreationPayload } from '../../services/OrderService';

interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export const SalesNotesFeature: React.FC = () => {
  const { orders, addOrder, deleteOrder, loading, refreshOrders } = useOrders();

  // State para el listado
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<ServiceOrder | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State para nueva nota
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const initialSaleState = {
    customer: { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', email: '', address: 'QUITO' },
    items: [{ id: '1', description: '', quantity: 1, price: 0 }] as SaleItem[],
    method: 'efectivo' as 'efectivo' | 'transferencia'
  };

  const [newSale, setNewSale] = useState(initialSaleState);

  // Filtrar solo notas de venta (NT)
  const salesNotes = useMemo(() => {
    return orders
      .filter(o => o.orderNumber.startsWith('NT'))
      .filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.documentId.includes(search)
      );
  }, [orders, search]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddItem = () => {
    setNewSale(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (newSale.items.length <= 1) return;
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const handleItemChange = (id: string, field: keyof SaleItem, value: string | number) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  const total = newSale.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);

  const handleCreateSale = async () => {
    if (total <= 0) return;
    setSaveStatus('saving');

    try {
      const description = newSale.items.map(i => `${i.quantity}x ${i.description}`).join(', ');

      // Creamos la nota vía useOrders (que llama a saveOrder en OrderService)
      // El backend se encarga de:
      // 1. Guardar en notas_venta
      // 2. Guardar en ingresos
      const result = await addOrder({
        customer: newSale.customer,
        repair: {
          reportedIssue: description,
          initialDeposit: total,
          repairTotalCost: total,
          evidencePhotos: []
        },
        paymentMethod: newSale.method, // Flags used by OrderService/Backend
        skipIncomeRecord: false       // Already handled by OrderService for NT flow
      } as OrderCreationPayload, 'NT');

      if (result) {
        showSuccess(`Nota de venta ${result.orderNumber} creada con éxito.`);
        setSaveStatus('success');

        // Preparar para imprimir automáticamente la nueva nota
        setSelectedNote(result);
        setIsPrintModalOpen(true);

        setTimeout(() => {
          setIsCreateModalOpen(false);
          setSaveStatus('idle');
          setNewSale(initialSaleState);
          refreshOrders();
        }, 1000);
      }
    } catch (err) {
      setSaveStatus('idle');
      alert("Error al crear la nota: " + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const labelClass = 'block text-xs font-medium text-surface-600 mb-1.5';
  const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Notas de venta"
        subtitle="Gestión de repuestos, accesorios y ventas directas"
      >
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full md:w-auto bg-surface-900 text-white px-5 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nueva nota de venta
        </button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-surface-200">
          <div className="relative w-full md:w-[440px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4 group-focus-within:text-primary-600 transition-colors duration-150" />
            <input
              type="text"
              placeholder="Buscar por cliente, documento o folio..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200">
                <th className="px-4 md:px-6 py-3">Folio</th>
                <th className="px-4 md:px-6 py-3 hidden md:table-cell">Emisión</th>
                <th className="px-4 md:px-6 py-3">Cliente</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Detalle</th>
                <th className="px-4 md:px-6 py-3 text-right">Monto</th>
                <th className="px-4 md:px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {salesNotes.map((note) => (
                <tr key={note.id} className="hover:bg-surface-50 transition-colors duration-150">
                  <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
                    <span className="font-mono text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-md">
                      {note.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden md:table-cell whitespace-nowrap">
                    <div className="text-sm text-surface-600">
                      {new Date(note.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5">
                    <div className="text-sm font-medium text-surface-900 truncate max-w-[150px] md:max-w-none">{note.customer.fullName}</div>
                    <div className="text-xs text-surface-500 mt-0.5 flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" />
                      {note.customer.documentId || 'N/A'}
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                    <div className="text-sm text-surface-600 line-clamp-2 max-w-xs">{note.repair.reportedIssue}</div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 text-right whitespace-nowrap">
                    <span className="font-semibold text-base text-surface-900 tracking-tight">${Number(note.repair.repairTotalCost).toFixed(2)}</span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedNote(note);
                          setIsPrintModalOpen(true);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors duration-150"
                        title="Imprimir comprobante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta nota de venta?')) {
                            deleteOrder(note.id);
                            showSuccess('Registro eliminado permanentemente');
                          }
                        }}
                        className="w-9 h-9 flex items-center justify-center text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-150"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {salesNotes.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-5 h-5 text-surface-400" />
                    </div>
                    <h4 className="text-base font-semibold text-surface-900">Sin notas de venta</h4>
                    <p className="text-sm text-surface-500 mt-1">Todavía no se registraron operaciones en este segmento.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Crear Nota de Venta ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-surface-900/40 z-[100] flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-surface-200 shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="px-5 md:px-6 py-4 border-b border-surface-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-900 text-white rounded-lg flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 leading-tight">Nueva nota de venta</h3>
                  <p className="text-sm text-surface-500">Venta directa de productos o servicios</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-surface-100 rounded-lg transition-colors duration-150 text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-8">
              {/* Sección Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-surface-900 border-b border-surface-200 pb-3">
                  <User className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold">Datos del cliente</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Documento de identidad (C.I. / RUC)</label>
                    <div className="relative group">
                       <input
                        type="text"
                        placeholder="Ej: 1792..."
                        className={inputClass + ' pr-16'}
                        value={newSale.customer.documentId}
                        onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, documentId: e.target.value }})}
                      />
                      <button
                        onClick={() => setNewSale({ ...newSale, customer: initialSaleState.customer })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-surface-600 hover:text-surface-900 bg-surface-100 hover:bg-surface-200 px-2.5 py-1 rounded-md transition-colors duration-150"
                        title="Usar consumidor final"
                      >
                        CF
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Nombre completo / Razón social</label>
                    <input
                      type="text"
                      placeholder="Identificación del comprador..."
                      className={inputClass}
                      value={newSale.customer.fullName}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, fullName: e.target.value.toUpperCase() }})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Teléfono de contacto</label>
                    <input
                      type="text"
                      placeholder="Ej: 09..."
                      className={inputClass}
                      value={newSale.customer.phone}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, phone: e.target.value }})}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Dirección</label>
                    <input
                      type="text"
                      placeholder="Ciudad / Sector..."
                      className={inputClass}
                      value={newSale.customer.address}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, address: e.target.value.toUpperCase() }})}
                    />
                  </div>
                </div>
              </div>

              {/* Sección Productos/Servicios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-200 pb-3">
                  <div className="flex items-center gap-2 text-surface-900">
                    <ShoppingBag className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold">Productos y servicios</span>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="text-sm font-medium text-surface-700 bg-white border border-surface-300 px-3 py-2 rounded-lg hover:bg-surface-50 transition-colors duration-150 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar ítem
                  </button>
                </div>

                <div className="space-y-3">
                  {newSale.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200 animate-fade-in">
                      <div className="hidden md:flex md:col-span-1 items-center justify-center">
                        <span className="w-7 h-7 rounded-full bg-white border border-surface-200 flex items-center justify-center font-medium text-surface-500 text-xs">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="col-span-1 md:col-span-6">
                        <label className={labelClass}>Descripción del ítem</label>
                        <input
                          type="text"
                          placeholder="Repuesto o servicio..."
                          className={inputClass}
                          value={item.description}
                          onChange={e => handleItemChange(item.id, 'description', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="grid grid-cols-2 col-span-1 md:col-span-4 gap-3">
                        <div>
                          <label className={labelClass}>Cantidad</label>
                          <input
                            type="number"
                            placeholder="1"
                            className={inputClass + ' text-center'}
                            value={item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>P. unit. ($)</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            className={inputClass + ' text-right'}
                            value={item.price}
                            onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-1 flex items-end justify-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={newSale.items.length === 1}
                          className="w-full md:w-10 h-10 flex items-center justify-center text-surface-400 hover:text-danger-600 hover:bg-danger-50 disabled:opacity-30 rounded-lg transition-colors duration-150 border border-surface-200 md:border-none bg-white md:bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="md:hidden ml-2 text-sm font-medium">Eliminar ítem</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips / Info */}
              <div className="bg-primary-50/50 rounded-xl p-4 flex items-start gap-3 border border-primary-100">
                <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm text-surface-600 leading-relaxed">
                  Al confirmar esta nota se registrará automáticamente un ingreso en Transacciones. Revisá los montos antes de continuar.
                </p>
              </div>
            </div>

            {/* Footer / Acción */}
            <div className="px-5 md:px-6 py-4 border-t border-surface-200 bg-surface-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-5 border-b border-surface-200 sm:border-none pb-3 sm:pb-0">
                <div className="flex flex-col">
                  <span className="text-xs text-surface-500">Total</span>
                  <span className="text-2xl font-semibold text-surface-900 leading-none tracking-tight mt-1">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div className="hidden sm:block h-10 w-px bg-surface-200" />

                <div className="flex flex-col">
                   <span className="text-xs text-surface-500 mb-1">Medio de pago</span>
                   <select
                    className="bg-white border border-surface-300 rounded-lg text-sm font-medium text-surface-900 px-2.5 py-1.5 cursor-pointer outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors duration-150"
                    value={newSale.method}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewSale({ ...newSale, method: e.target.value as 'efectivo' | 'transferencia' })}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 h-11 border border-surface-300 bg-white text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateSale}
                  disabled={saveStatus !== 'idle' || total <= 0}
                  className="px-6 h-11 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  {saveStatus === 'saving' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                  ) : saveStatus === 'success' ? (
                    <><CheckCircle className="w-4 h-4" /> ¡Guardada!</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Confirmar venta</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Configuración de Impresión ─── */}
      <PrintManager
        isOpen={isPrintModalOpen}
        order={selectedNote}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedNote(null);
        }}
      />

      {/* ─── Toast de Éxito ─── */}
      {successMessage && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] animate-fade-in-up">
          <div className="bg-surface-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-full shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Operación exitosa</p>
              <p className="text-xs text-surface-300 mt-0.5 truncate">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
