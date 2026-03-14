import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { DollarSign, Wallet, ArrowDownRight, TrendingUp, Calculator, Wrench, ShoppingBag, Plus, Trash2, User, FileText, X } from 'lucide-react';
import type { PaymentMethod, PaymentType, TransactionType, SaleItem, CustomerData } from '../types';
import { printReceipt } from '../utils/printHelpers';

export const CashRegister = () => {
  const { payments, addPayment } = useAppContext();
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  
  // Basic date filter to today
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);

  const filteredPayments = payments.filter(p => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (p.date.startsWith(dateFilter)) return true;
    return false;
  });

  const ingresos = filteredPayments.filter(p => p.transactionType === 'ingreso');
  const egresos = filteredPayments.filter(p => p.transactionType === 'egreso');

  const totals = {
    efectivo: ingresos.filter(p => p.method === 'efectivo').reduce((acc, p) => acc + p.amount, 0) - egresos.filter(p => p.method === 'efectivo').reduce((acc, p) => acc + p.amount, 0),
    transferencia: ingresos.filter(p => p.method === 'transferencia').reduce((acc, p) => acc + p.amount, 0) - egresos.filter(p => p.method === 'transferencia').reduce((acc, p) => acc + p.amount, 0),
    ingresosTotal: ingresos.reduce((acc, p) => acc + p.amount, 0),
    egresosTotal: egresos.reduce((acc, p) => acc + p.amount, 0),
    total: ingresos.reduce((acc, p) => acc + p.amount, 0) - egresos.reduce((acc, p) => acc + p.amount, 0),
    reparaciones: ingresos.filter(p => p.type === 'reparacion').reduce((acc, p) => acc + p.amount, 0),
    repuestos: ingresos.filter(p => p.type === 'repuestos').reduce((acc, p) => acc + p.amount, 0),
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    method: 'efectivo' as PaymentMethod,
    type: 'reparacion' as PaymentType,
    transactionType: 'ingreso' as TransactionType,
    description: ''
  });

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleData, setSaleData] = useState({
    customer: { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', email: '', address: '' } as CustomerData,
    items: [{ id: '1', description: '', quantity: 1, price: 0 }] as SaleItem[],
    method: 'efectivo' as PaymentMethod,
    format: '58mm'
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.amount || isNaN(Number(newPayment.amount))) return;
    
    addPayment({
      amount: Number(newPayment.amount),
      method: newPayment.method,
      type: newPayment.type,
      transactionType: newPayment.transactionType,
      description: newPayment.description
    });
    
    setIsModalOpen(false);
    setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const total = saleData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (total <= 0) return;

    const saleNumber = `VNT-${Math.floor(100000 + Math.random() * 900000)}`;
    const description = saleData.items.map(i => `${i.quantity}x ${i.description}`).join(', ');

    const newTransaction = {
      amount: total,
      method: saleData.method,
      type: 'repuestos' as PaymentType,
      transactionType: 'ingreso' as TransactionType,
      description: `Venta Directa: ${description}`,
      customer: saleData.customer,
      items: saleData.items,
      saleNumber: saleNumber,
      date: new Date().toISOString()
    };

    addPayment(newTransaction);
    
    // Print the receipt
    printReceipt(newTransaction as any, saleData.format, 'nota-venta');

    setIsSaleModalOpen(false);
    setSaleData({
      customer: { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', email: '', address: '' },
      items: [{ id: '1', description: '', quantity: 1, price: 0 }],
      method: 'efectivo',
      format: '58mm'
    });
  };

  const addSaleItem = () => {
    setSaleData({
      ...saleData,
      items: [...saleData.items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }]
    });
  };

  const removeSaleItem = (id: string) => {
    if (saleData.items.length === 1) return;
    setSaleData({
      ...saleData,
      items: saleData.items.filter(item => item.id !== id)
    });
  };

  const updateSaleItem = (id: string, updates: Partial<SaleItem>) => {
    setSaleData({
      ...saleData,
      items: saleData.items.map(item => item.id === id ? { ...item, ...updates } : item)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cuadre de Caja</h2>
          <p className="text-gray-500 mt-1">Registra e inspecciona los ingresos del día.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setIsSaleModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            + Nueva Nota de Venta
          </button>
          <button 
            onClick={() => {
              setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
              setIsModalOpen(true);
            }}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            + Registrar Ingreso
          </button>
          <button 
            onClick={() => {
              setNewPayment({ amount: '', method: 'efectivo', type: 'otro', transactionType: 'egreso', description: '' });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          >
            <Wallet className="w-5 h-5" />
            - Registrar Egreso
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 items-center flex-1 w-full relative">
          <input 
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-3 pr-4 py-2 w-full sm:w-auto border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-shadow items-center justify-center text-gray-700"
          />
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto shrink-0 shadow-inner">
          <button 
            onClick={() => setMethodFilter('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${methodFilter === 'all' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setMethodFilter('efectivo')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${methodFilter === 'efectivo' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Efectivo
          </button>
          <button 
            onClick={() => setMethodFilter('transferencia')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${methodFilter === 'transferencia' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Transferencia
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Efectivo en Caja', value: totals.efectivo, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Transferencias', value: totals.transferencia, icon: ArrowDownRight, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Reparaciones', value: totals.reparaciones, icon: Wrench, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Repuestos', value: totals.repuestos, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
               <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">${stat.value.toFixed(2)}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 border border-gray-700">
        <div className="absolute -right-10 -bottom-10 opacity-10">
           <TrendingUp className="w-56 h-56" strokeWidth={1} />
        </div>
        <div className="relative z-10 flex flex-col items-center sm:items-start">
           <h3 className="text-gray-400 font-semibold mb-2 flex items-center gap-2"><Calculator className="w-5 h-5"/> BALANCE NETO DEL DÍA</h3>
           <p className={`text-5xl font-extrabold tracking-tight ${totals.total >= 0 ? 'text-white' : 'text-red-400'}`}>
              ${totals.total.toFixed(2)}
           </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 w-full sm:w-auto relative z-10 sm:min-w-[200px] border border-white/5 shadow-inner space-y-2">
           <div className="flex justify-between items-center mb-1">
             <span className="text-white/70 text-sm">Resumen</span>
             <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{new Date(dateFilter).toLocaleDateString()}</span>
           </div>
           <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
             <span className="text-white/90">Ingresos Totales</span>
             <span className="font-semibold text-emerald-400">+{totals.ingresosTotal.toFixed(2)}$</span>
           </div>
           <div className="flex justify-between gap-4">
             <span className="text-white/90">Egresos (Gastos)</span>
             <span className="font-semibold text-red-400">-{totals.egresosTotal.toFixed(2)}$</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-semibold">Hora</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Método</th>
                <th className="px-6 py-4 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{payment.description || 'Sin descripción'}</span>
                    {payment.orderId && <div className="text-xs text-indigo-600 font-medium">Orden: {payment.orderId}</div>}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                        payment.type === 'reparacion' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                     }`}>
                        {payment.type}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {payment.method === 'efectivo' ? <Wallet className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-blue-600" />}
                      <span className="text-sm font-medium text-gray-700 capitalize">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`font-bold text-lg ${payment.transactionType === 'egreso' ? 'text-red-500' : 'text-emerald-600'}`}>
                      {payment.transactionType === 'egreso' ? '-' : '+'}${payment.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No se encontraron transacciones en esta fecha.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Basic Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 overflow-y-auto w-full transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in slide-in-from-bottom-8 duration-300">
            <h3 className={`text-xl font-bold tracking-tight mb-6 flex items-center gap-2 ${newPayment.transactionType === 'ingreso' ? 'text-green-700' : 'text-red-600'}`}>
              <Wallet className={`h-6 w-6 ${newPayment.transactionType === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}/> 
              {newPayment.transactionType === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
            </h3>
            
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-gray-50/50 font-bold text-lg text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input 
                  type="text" 
                  required
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-900 text-sm uppercase"
                  placeholder={newPayment.transactionType === 'ingreso' ? "Ej. Cambio de batería iPhone 11" : "Ej. Pago de Internet"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                  <select 
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value as PaymentMethod})}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-900 text-sm font-medium bg-white"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select 
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({...newPayment, type: e.target.value as PaymentType})}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-gray-900 text-sm font-medium bg-white"
                  >
                    {newPayment.transactionType === 'ingreso' ? (
                      <>
                        <option value="reparacion">Reparación</option>
                        <option value="repuestos">Repuestos</option>
                        <option value="otro">Otro Ingreso</option>
                      </>
                    ) : (
                      <>
                        <option value="arriendo">Arriendo</option>
                        <option value="insumos">Insumos/Stock</option>
                        <option value="servicios">Servicios Básicos</option>
                        <option value="otro">Otro Gasto</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t mt-6">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all active:scale-95"
                 >
                   Cancelar
                 </button>
                 <button 
                  type="submit" 
                  className={`flex-1 text-white px-4 py-3 rounded-xl font-bold shadow-sm border border-transparent focus:ring-2 focus:ring-offset-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${newPayment.transactionType === 'ingreso' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                 >
                   Guardar
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Nueva Nota de Venta (Venta Directa)
              </h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre / Razón Social</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                      value={saleData.customer.fullName}
                      onChange={e => setSaleData({...saleData, customer: {...saleData.customer, fullName: e.target.value.toUpperCase()}})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">RUC / Cédula</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={saleData.customer.documentId}
                      onChange={e => setSaleData({...saleData, customer: {...saleData.customer, documentId: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    type="button"
                    onClick={() => setSaleData({...saleData, customer: { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', email: '', address: '' }})}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                   >
                     Usar Consumidor Final
                   </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    Detalle de Venta
                  </h4>
                  <button 
                    type="button" 
                    onClick={addSaleItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Añadir Ítem
                  </button>
                </div>

                <div className="space-y-3">
                  {saleData.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cant</label>
                        <input 
                          type="number" 
                          min="1"
                          className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                          value={item.quantity}
                          onChange={e => updateSaleItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="col-span-6">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                        <input 
                          type="text" 
                          placeholder="Ej. Mica de Privacidad iPhone 13"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                          value={item.description}
                          onChange={e => updateSaleItem(item.id, { description: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">P. Unit ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                          value={item.price}
                          onChange={e => updateSaleItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-1">
                         <button 
                          type="button"
                          onClick={() => removeSaleItem(item.id)}
                          className="w-full aspect-square flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Config & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Formato de Impresión</label>
                    <div className="flex gap-2">
                       {['58mm', '80mm', 'A4'].map(f => (
                         <button
                           key={f}
                           type="button"
                           onClick={() => setSaleData({...saleData, format: f})}
                           className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${saleData.format === f ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago</label>
                    <div className="flex gap-2">
                       {['efectivo', 'transferencia'].map(m => (
                         <button
                           key={m}
                           type="button"
                           onClick={() => setSaleData({...saleData, method: m as PaymentMethod})}
                           className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all capitalize ${saleData.method === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-3xl p-6 text-white flex flex-col justify-center items-center">
                  <p className="text-gray-400 text-sm font-semibold mb-1">TOTAL A PAGAR</p>
                  <h3 className="text-4xl font-black text-white">$
                    {saleData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                  </h3>
                </div>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 sticky bottom-0">
               <button 
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                className="flex-1 bg-white border border-gray-300 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
               >
                 Cancelar
               </button>
               <button 
                type="button"
                onClick={handleCreateSale}
                className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
               >
                 Procesar & Imprimir
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

