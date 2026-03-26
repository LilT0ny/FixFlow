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
  Info
} from 'lucide-react';
import { PrintManager } from '../../components/organisms/PrintManager';
import type { ServiceOrder } from '../../types';

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

  const handleItemChange = (id: string, field: keyof SaleItem, value: any) => {
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
        paymentMethod: newSale.method // Pasamos el método de pago
      } as any, 'NT');

      if (result) {
        showSuccess(`✓ Nota de Venta ${result.orderNumber} creada con éxito.`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">Notas de Venta</h2>
          <p className="text-surface-500 mt-1">Gestión y facturación de ventas directas de repuestos y accesorios.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-200 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nueva Nota de Venta
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente o cédula..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/30 text-[11px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100">
                <th className="px-6 py-4">N° Nota</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {salesNotes.map((note) => (
                <tr key={note.id} className="hover:bg-surface-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg text-xs">
                      {note.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {new Date(note.createdAt).toLocaleDateString('es-EC')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-surface-900 text-sm">{note.customer.fullName}</div>
                    <div className="text-[10px] text-surface-500">{note.customer.documentId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-surface-600 truncate max-w-xs">{note.repair.reportedIssue}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-surface-900">${Number(note.repair.repairTotalCost).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                       <button
                        onClick={() => {
                          setSelectedNote(note);
                          setIsPrintModalOpen(true);
                        }}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                        title="Re-imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta nota de venta?')) {
                            deleteOrder(note.id);
                            showSuccess('Nota eliminada');
                          }
                        }}
                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {salesNotes.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-sm">No se encontraron notas de venta.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Crear Nota de Venta ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 py-8">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-full flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-surface-100 bg-surface-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900">Nueva Nota de Venta</h3>
                  <p className="text-xs text-surface-500">Completa los datos para generar el comprobante</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-surface-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-surface-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Sección Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary-600 border-b border-primary-100 pb-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Información del Cliente</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-surface-500 uppercase ml-1">Cédula / RUC</label>
                    <div className="relative">
                       <input
                        type="text"
                        placeholder="Ej: 1792..."
                        className="w-full pl-4 pr-10 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 font-bold"
                        value={newSale.customer.documentId}
                        onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, documentId: e.target.value }})}
                      />
                      <button 
                        onClick={() => setNewSale({ ...newSale, customer: initialSaleState.customer })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 text-[10px] font-bold hover:underline"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-surface-500 uppercase ml-1">Nombre Completo / Razón Social</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 uppercase font-bold text-surface-900"
                      value={newSale.customer.fullName}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, fullName: e.target.value.toUpperCase() }})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Teléfono"
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
                    value={newSale.customer.phone}
                    onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, phone: e.target.value }})}
                  />
                  <input
                    type="text"
                    placeholder="Dirección / Ciudad"
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 uppercase font-medium"
                    value={newSale.customer.address}
                    onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, address: e.target.value.toUpperCase() }})}
                  />
                </div>
              </div>

              {/* Sección Productos/Servicios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary-100 pb-2">
                  <div className="flex items-center gap-2 text-primary-600">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Detalle de la Venta</span>
                  </div>
                  <button 
                    onClick={handleAddItem}
                    className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-colors uppercase"
                  >
                    + Agregar Item
                  </button>
                </div>

                <div className="space-y-3">
                  {newSale.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 p-3 bg-surface-50 rounded-2xl border border-surface-200 group animate-in slide-in-from-right-2 duration-200">
                      <div className="col-span-1 flex items-center justify-center font-black text-surface-400 text-xs">
                        #{idx + 1}
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Descripción del producto o servicio"
                          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-primary-500"
                          value={item.description}
                          onChange={e => handleItemChange(item.id, 'description', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Cant."
                          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-primary-500"
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Precio"
                          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-black text-right focus:ring-2 focus:ring-primary-500 text-success-600"
                          value={item.price}
                          onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={newSale.items.length === 1}
                          className="p-2 text-danger-300 hover:text-danger-600 disabled:opacity-30 hover:bg-danger-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips / Info */}
              <div className="bg-surface-50 rounded-2xl p-4 flex items-start gap-3 border border-surface-100">
                <Info className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-surface-500 leading-relaxed italic">
                  Las notas de venta registradas afectan automáticamente al flujo de caja (Ingresos) y se guardan cronológicamente para reportes posteriores.
                </p>
              </div>
            </div>

            {/* Footer / Acción */}
            <div className="p-6 border-t border-surface-100 bg-surface-50/50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Total a Pagar</span>
                <span className="text-3xl font-black text-surface-900 leading-none">
                  ${total.toFixed(2)}
                </span>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3 border border-surface-300 text-surface-600 rounded-2xl font-bold hover:bg-surface-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateSale}
                  disabled={saveStatus !== 'idle' || total <= 0}
                  className="px-8 py-3 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {saveStatus === 'saving' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                  ) : saveStatus === 'success' ? (
                    <><CheckCircle className="w-5 h-5" /> ¡Completado!</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Generar Nota</>
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
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-primary-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}
    </div>
  );
};
