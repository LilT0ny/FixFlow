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
  CreditCard,
  Phone,
  MapPin
} from 'lucide-react';
import { PrintManager } from '../../components/organisms/PrintManager';
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
    <div className="space-y-10 max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-surface-900">
            Notas de Venta
          </h2>
          <p className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80">
            Gestión de Repuestos, Accesorios y Ventas Directas
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary-200/50 flex items-center justify-center gap-3 hover:bg-primary-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nueva Nota de Venta
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-surface-100/50 shadow-2xl shadow-surface-200/30 overflow-hidden animate-zoom-in">
        <div className="p-6 border-b border-surface-50 bg-surface-50/30 backdrop-blur-md">
          <div className="relative w-full md:w-[500px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, documento o folio..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-surface-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50 text-[10px] font-black text-surface-400 uppercase tracking-[0.25em] border-b border-surface-100">
                <th className="px-8 py-5">N° Folio</th>
                <th className="px-8 py-5">Emisión</th>
                <th className="px-8 py-5">Identidad Cliente</th>
                <th className="px-8 py-5">Canales de Contacto</th>
                <th className="px-8 py-5">Detalle de Operación</th>
                <th className="px-8 py-5 text-right">Valor Neto</th>
                <th className="px-8 py-5 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {salesNotes.map((note, idx) => (
                <tr key={note.id} style={{ animationDelay: `${idx * 40}ms` }} className="hover:bg-surface-50/50 transition-colors group animate-in fade-in slide-in-from-left-4">
                  <td className="px-8 py-6">
                    <span className="font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-xl text-[10px] border border-primary-100 uppercase tracking-widest shadow-sm">
                      {note.orderNumber}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-black text-surface-900 uppercase tracking-tighter">
                      {new Date(note.createdAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-surface-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{note.customer.fullName}</div>
                    <div className="text-surface-400 font-black text-[9px] mt-2 flex items-center gap-2 bg-surface-50 w-fit px-2 py-1 rounded-lg border border-surface-100 uppercase tracking-widest">
                      <CreditCard className="w-3 h-3 text-primary-400" /> 
                      {note.customer.documentId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-surface-600 font-bold">
                        <Phone className="w-3.5 h-3.5 text-primary-400" /> 
                        {note.customer.phone || '—'}
                      </div>
                      {note.customer.address && (
                        <div className="flex items-start gap-2 text-[10px] text-surface-400 font-bold uppercase tracking-tight max-w-[200px] line-clamp-1 italic" title={note.customer.address}>
                          <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                          {note.customer.address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[11px] text-surface-500 font-black uppercase tracking-tight line-clamp-2 leading-relaxed max-w-xs">{note.repair.reportedIssue}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-2xl text-surface-900 tracking-tighter">${Number(note.repair.repairTotalCost).toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                       <button
                        onClick={() => {
                          setSelectedNote(note);
                          setIsPrintModalOpen(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-primary-600 bg-primary-50 hover:bg-primary-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                        title="Imprimir Comprobante"
                      >
                        <Printer className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta nota de venta?')) {
                            deleteOrder(note.id);
                            showSuccess('Registro eliminado permanentemente');
                          }
                        }}
                        className="w-10 h-10 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                        title="Eliminar Registro"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {salesNotes.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="w-24 h-24 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-surface-100">
                      <FileText className="w-10 h-10 text-surface-200 opacity-50" />
                    </div>
                    <h4 className="text-lg font-black text-surface-900 tracking-tight">Archivo Vacío</h4>
                    <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mt-2">No se han registrado operaciones bajo este segmento</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Crear Nota de Venta ─── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-md z-[100] flex justify-center items-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-4xl max-h-[90vh] flex flex-col animate-zoom-in overflow-hidden border border-white/20">
            {/* Header */}
            <div className="px-10 py-8 border-b border-surface-50 bg-surface-50/30 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-[20px] shadow-xl shadow-primary-200/50 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-surface-900 tracking-tight leading-none">Nueva Transacción</h3>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mt-2 opacity-60">Generación de Nota de Venta Directa</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-100 rounded-full transition-all text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              {/* Sección Cliente */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary-600">
                  <User className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Entidad de la Operación</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Documento de Identidad (C.I / RUC)</label>
                    <div className="relative group">
                       <input
                        type="text"
                        placeholder="Ej: 1792..."
                        className="w-full pl-6 pr-20 py-4 bg-surface-50 border border-surface-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-inner"
                        value={newSale.customer.documentId}
                        onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, documentId: e.target.value }})}
                      />
                      <button 
                        onClick={() => setNewSale({ ...newSale, customer: initialSaleState.customer })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600 text-[10px] font-black uppercase tracking-tighter hover:bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm transition-all"
                      >
                        Final
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Nombre Completo / Razón Social</label>
                    <input
                      type="text"
                      placeholder="Identificación del Comprador..."
                      className="w-full px-6 py-4 bg-white border border-surface-100 rounded-2xl text-sm font-black uppercase focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
                      value={newSale.customer.fullName}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, fullName: e.target.value.toUpperCase() }})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Contacto Telefónico</label>
                    <input
                      type="text"
                      placeholder="Ej: 09..."
                      className="w-full px-6 py-4 bg-white border border-surface-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm"
                      value={newSale.customer.phone}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, phone: e.target.value }})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Dirección Domiciliaria</label>
                    <input
                      type="text"
                      placeholder="Ciudad / Sector..."
                      className="w-full px-6 py-4 bg-white border border-surface-100 rounded-2xl text-sm font-bold uppercase focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm"
                      value={newSale.customer.address}
                      onChange={e => setNewSale({ ...newSale, customer: { ...newSale.customer, address: e.target.value.toUpperCase() }})}
                    />
                  </div>
                </div>
              </div>

              {/* Sección Productos/Servicios */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-primary-600">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Inventario / Servicios a Glosar</span>
                  </div>
                  <button 
                    onClick={handleAddItem}
                    className="text-[10px] font-black text-primary-600 bg-primary-50 px-6 py-3 rounded-2xl hover:bg-primary-600 hover:text-white transition-all uppercase tracking-widest border border-primary-100 shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Expandir Detalle
                  </button>
                </div>

                <div className="space-y-6">
                  {newSale.items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-5 p-6 bg-surface-50 rounded-[28px] border border-surface-100 transition-all hover:bg-white hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/20 group animate-in slide-in-from-right-4 duration-300">
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center font-black text-surface-400 text-[10px] shadow-inner">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="col-span-6 space-y-2">
                        <label className="text-[9px] font-black text-surface-400 uppercase ml-1">Descripción del Ítem</label>
                        <input
                          type="text"
                          placeholder="Repuesto o servicio..."
                          className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-xs font-black uppercase focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm"
                          value={item.description}
                          onChange={e => handleItemChange(item.id, 'description', e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[9px] font-black text-surface-400 uppercase text-center block">Uds.</label>
                        <input
                          type="number"
                          placeholder="1"
                          className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-xs font-black text-center focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm"
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[9px] font-black text-surface-400 uppercase text-right block pr-1">P. Unit ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-xs font-black text-right focus:ring-4 focus:ring-emerald-500/10 text-emerald-600 outline-none transition-all shadow-sm"
                          value={item.price}
                          onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-center pb-2">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={newSale.items.length === 1}
                          className="w-10 h-10 flex items-center justify-center text-rose-300 hover:text-white hover:bg-rose-500 disabled:opacity-30 rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips / Info */}
              <div className="bg-surface-50 rounded-[28px] p-6 flex items-start gap-4 border border-surface-100 shadow-inner">
                <Info className="w-6 h-6 text-primary-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-surface-400 uppercase tracking-widest">Aviso Operacional</p>
                  <p className="text-xs text-surface-500 leading-relaxed italic">
                    La confirmación de esta nota disparará automáticamente un registro de ingreso en la Tesorería General. Revise los montos antes de proceder.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / Acción */}
            <div className="px-10 py-8 border-t border-surface-50 bg-surface-50/30 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Total Consolidado</span>
                  <span className="text-4xl font-black text-surface-900 leading-none tracking-tighter mt-1">
                    ${total.toFixed(2)}
                  </span>
                </div>
                
                <div className="h-10 w-[1px] bg-surface-200" />
                
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Forma de Pago</span>
                  <select 
                    className="mt-1 bg-transparent border-none text-[11px] font-black text-primary-600 focus:ring-0 uppercase cursor-pointer p-0"
                    value={newSale.method}
                    onChange={e => setNewSale({ ...newSale, method: e.target.value as any })}
                  >
                    <option value="efectivo">EFECTIVO</option>
                    <option value="transferencia">BANCO / TRANSF</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-8 py-4 border border-surface-200 text-surface-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-surface-100 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateSale}
                  disabled={saveStatus !== 'idle' || total <= 0}
                  className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-700 transition-all shadow-2xl shadow-primary-200/50 flex items-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {saveStatus === 'saving' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                  ) : saveStatus === 'success' ? (
                    <><CheckCircle className="w-5 h-5" /> ¡Sincronizado!</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Sellar Factura</>
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
        <div className="fixed bottom-10 right-10 z-[200] animate-in fade-in slide-in-from-right-10 duration-500">
           <div className="bg-surface-950 text-white px-8 py-5 rounded-[28px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex items-center gap-5 border border-surface-800 backdrop-blur-xl">
            <div className="bg-primary-500 p-2.5 rounded-full shadow-lg shadow-primary-500/20">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-sm tracking-tight leading-none">Notificación de Sistema</p>
              <p className="text-[11px] text-surface-400 font-bold uppercase tracking-widest mt-2">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
