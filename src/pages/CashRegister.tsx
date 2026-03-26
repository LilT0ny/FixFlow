import { useState, useEffect } from 'react';
import { usePayments } from '../hooks/usePayments'; // MVC Controller
import { 
  Wallet, 
  ArrowDownRight, 
  TrendingUp, 
  Calculator, 
  Wrench, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  User, 
  X, 
  Printer, 
  ReceiptText, 
  Minus,
  CalendarDays,
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import type { PaymentMethod, PaymentType, TransactionType, SaleItem, CustomerData, PaymentTransaction } from '../types';
import { printReceipt } from '../utils/printHelpers';
import { useSettings } from '../store/SettingsContext';

import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Card } from '../components/atoms/Card';

export const CashRegister = () => {
  // Using MVC Controller Hooks
  const { payments, addPayment } = usePayments();
  const { settings } = useSettings();
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  
  // Basic date filter to today
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);

  const filteredPayments = Array.isArray(payments) ? payments.filter(p => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (p.date.startsWith(dateFilter)) return true;
    return false;
  }) : [];

  const ingresos = Array.isArray(payments) ? filteredPayments.filter(p => p.transactionType === 'ingreso') : [];
  const egresos = Array.isArray(payments) ? filteredPayments.filter(p => p.transactionType === 'egreso') : [];

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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.amount || isNaN(Number(newPayment.amount))) return;
    
    setSaveStatus('saving');
    
    await addPayment({
      amount: Number(newPayment.amount),
      method: newPayment.method,
      type: newPayment.type,
      transactionType: newPayment.transactionType,
      description: newPayment.description
    });
    
    setSaveStatus('success');
    setShowSuccessToast(true);
    
    setTimeout(() => {
      setIsModalOpen(false);
      setSaveStatus('idle');
      setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
    }, 1500);
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = saleData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (total <= 0) return;

    setSaveStatus('saving');

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
      saleNumber: saleNumber
    };

    const added = await addPayment(newTransaction);
    
    // Print the receipt
    if (added) {
      printReceipt(added as unknown as PaymentTransaction, saleData.format, 'nota-venta', true, settings);
    }

    setSaveStatus('success');
    setShowSuccessToast(true);

    setTimeout(() => {
      setIsSaleModalOpen(false);
      setSaveStatus('idle');
      setSaleData({
        customer: { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', email: '', address: '' },
        items: [{ id: '1', description: '', quantity: 1, price: 0 }],
        method: 'efectivo',
        format: '58mm'
      });
    }, 1500);
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
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">Transacciones</h2>
          <p className="text-gray-500 mt-1">Administra el flujo de dinero, ingresos y egresos diarios.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => setIsSaleModalOpen(true)} 
            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-primary-700 transition-all active:scale-95"
          >
            <ReceiptText className="w-5 h-5" />
            Venta
          </Button>

          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
                setIsModalOpen(true);
              }} 
              className="flex-1 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Ingreso
            </Button>
            <Button 
              onClick={() => {
                setNewPayment({ amount: '', method: 'efectivo', type: 'otro', transactionType: 'egreso', description: '' });
                setIsModalOpen(true);
              }} 
              className="flex-1 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-rose-700 transition-all active:scale-95"
            >
              <Minus className="w-5 h-5" />
              Egreso
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center relative w-full sm:w-auto">
          {/* Icono posicionado absolutamente */}
          <CalendarDays className="w-5 h-5 text-gray-400 absolute left-3 z-10 pointer-events-none" />
          
          <input 
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            title="Filtrar por fecha"
            className="bg-transparent border-none outline-none ring-0 focus:ring-0 pl-10 pr-2 py-1 text-sm font-medium text-surface-700 cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        
        <div className="flex bg-surface-100 p-1 rounded-xl w-full sm:w-auto shrink-0 shadow-inner">
          <button 
            onClick={() => setMethodFilter('all')}
            className={`flex flex-1 sm:flex-none items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${methodFilter === 'all' ? 'bg-white shadow-sm text-surface-900 border border-surface-200' : 'text-surface-500 hover:text-surface-700'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setMethodFilter('efectivo')}
            className={`flex flex-1 sm:flex-none items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${methodFilter === 'efectivo' ? 'bg-white shadow-sm text-surface-900 border border-surface-200' : 'text-surface-500 hover:text-surface-700'}`}
          >
            Efectivo
          </button>
          <button 
            onClick={() => setMethodFilter('transferencia')}
            className={`flex-1 sm:flex-none items-center justify-center px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${methodFilter === 'transferencia' ? 'bg-white shadow-sm text-surface-900 border border-surface-200' : 'text-surface-500 hover:text-surface-700'}`}
          >
            Transferencia
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Efectivo en Caja', value: totals.efectivo, icon: Coins, color: 'text-success-600', bg: 'bg-success-50' },
          { label: 'Transferencias', value: totals.transferencia, icon: ArrowRightLeft, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Total Reparaciones', value: totals.reparaciones, icon: Wrench, color: 'text-secondary-600', bg: 'bg-secondary-50' },
          { label: 'Total Repuestos', value: totals.repuestos, icon: ShoppingBag, color: 'text-warning-600', bg: 'bg-warning-50' }
        ].map((stat, i) => (
          <Card key={i} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
               <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-surface-900">${stat.value.toFixed(2)}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-br from-surface-900 to-surface-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 border border-surface-700">
        <div className="absolute -right-10 -bottom-10 opacity-10">
           <TrendingUp className="w-56 h-56" strokeWidth={1} />
        </div>
        <div className="relative z-10 flex flex-col items-center sm:items-start">
           <h3 className="text-surface-400 font-semibold mb-2 flex items-center gap-2"><Calculator className="w-5 h-5"/> BALANCE NETO DEL DÍA</h3>
           <p className={`text-5xl font-extrabold tracking-tight ${totals.total >= 0 ? 'text-white' : 'text-danger-400'}`}>
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
             <span className="font-semibold text-success-400">+{totals.ingresosTotal.toFixed(2)}$</span>
           </div>
           <div className="flex justify-between gap-4">
             <span className="text-white/90">Egresos (Gastos)</span>
             <span className="font-semibold text-danger-400">-{totals.egresosTotal.toFixed(2)}$</span>
           </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
            <thead>
              <tr className="bg-surface-50 text-surface-500 text-xs uppercase tracking-wider border-b border-surface-100">
                <th className="px-6 py-4 font-semibold shrink-0">Hora</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-4 py-4 font-semibold hidden md:table-cell">Tipo</th>
                <th className="px-4 py-4 font-semibold hidden sm:table-cell">Método</th>
                <th className="px-6 py-4 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500 font-medium">
                    {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-surface-900 truncate max-w-[150px] md:max-w-none">
                      {payment.description || 'Sin descripción'}
                    </div>
                    {payment.orderId && <div className="text-[10px] sm:text-xs text-primary-600 font-medium mt-1">Orden: {payment.orderId}</div>}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                     <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        payment.type === 'reparacion' ? 'bg-primary-50 text-primary-700' : 'bg-secondary-50 text-secondary-700'
                     }`}>
                        {payment.type}
                     </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      {payment.method === 'efectivo' ? <Wallet className="w-4 h-4 text-success-600" /> : <ArrowDownRight className="w-4 h-4 text-primary-600" />}
                      <span className="text-sm font-medium text-surface-700 capitalize">{payment.method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 sm:gap-3">
                      <span className={`font-bold text-base sm:text-lg ${payment.transactionType === 'egreso' ? 'text-danger-500' : 'text-success-600'}`}>
                        {payment.transactionType === 'egreso' ? '-' : '+'}${payment.amount.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => printReceipt(payment as unknown as PaymentTransaction, '58mm', 'nota-venta', false, settings)}
                        title="Imprimir comprobante"
                        className="text-surface-400 hover:text-primary-600 transition-colors bg-white hover:bg-primary-50 p-1.5 rounded-lg border border-transparent hover:border-primary-100 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-surface-500">
                    No se encontraron transacciones en esta fecha.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Basic Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 overflow-y-auto w-full transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in slide-in-from-bottom-8 duration-300">
            <h3 className={`text-xl font-bold tracking-tight mb-6 flex items-center gap-2 ${newPayment.transactionType === 'ingreso' ? 'text-success-700' : 'text-danger-600'}`}>
              <Wallet className={`h-6 w-6 ${newPayment.transactionType === 'ingreso' ? 'text-success-600' : 'text-danger-500'}`}/> 
              {newPayment.transactionType === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
            </h3>
            
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Monto ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-surface-500">$</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    required
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    className="pl-8 text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Descripción</label>
                <Input 
                  type="text" 
                  required
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                  className="uppercase"
                  placeholder={newPayment.transactionType === 'ingreso' ? "Ej. Cambio de batería iPhone 11" : "Ej. Pago de Internet"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Método</label>
                  <select 
                    value={newPayment.method}
                    title="Seleccionar método de pago"
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value as PaymentMethod})}
                    className="w-full px-3 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-surface-900 text-sm font-medium bg-white"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Categoría</label>
                  <select 
                    value={newPayment.type}
                    title="Seleccionar categoría de transacción"
                    onChange={(e) => setNewPayment({...newPayment, type: e.target.value as PaymentType})}
                    className="w-full px-3 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-surface-900 text-sm font-medium bg-white"
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
              
              <div className="flex gap-3 pt-4 border-t border-surface-100 mt-6">
                 <Button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                 >
                   Cancelar
                 </Button>
                 <Button 
                  type="submit" 
                  variant={newPayment.transactionType === 'ingreso' ? 'success' : 'danger'}
                  className="flex-1"
                  disabled={saveStatus !== 'idle'}
                 >
                   {saveStatus === 'saving' ? (
                     <>
                       <Loader2 className="w-4 h-4 animate-spin" />
                       Guardando...
                     </>
                   ) : saveStatus === 'success' ? (
                     <>
                       <CheckCircle2 className="w-4 h-4" />
                       Guardado
                     </>
                   ) : 'Guardar'}
                 </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex justify-center items-center py-10 px-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-surface-100 flex justify-between items-center bg-surface-50 rounded-t-3xl">
              <h3 className="text-xl font-bold text-primary-600 flex items-center gap-2">
                <ReceiptText className="w-6 h-6" />
                Nueva Nota de Venta
              </h3>
              <button 
                onClick={() => setIsSaleModalOpen(false)} 
                title="Cerrar modal"
                className="text-surface-400 hover:text-surface-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-surface-900 flex items-center gap-2 border-b border-surface-100 pb-2">
                  <User className="w-4 h-4 text-primary-500" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">Nombre / Razón Social</label>
                    <Input 
                      type="text" 
                      className="uppercase"
                      value={saleData.customer.fullName}
                      onChange={e => setSaleData({...saleData, customer: {...saleData.customer, fullName: e.target.value.toUpperCase()}})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-500 uppercase mb-1">RUC / Cédula</label>
                    <Input 
                      type="text" 
                      value={saleData.customer.documentId}
                      onChange={e => setSaleData({...saleData, customer: {...saleData.customer, documentId: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    type="button"
                    onClick={() => setSaleData({...saleData, customer: { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', email: '', address: '' }})}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-primary-100"
                   >
                     Usar Consumidor Final
                   </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-surface-100 pb-2">
                  <h4 className="font-bold text-surface-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary-500" />
                    Detalle de Venta
                  </h4>
                  <button 
                    type="button" 
                    onClick={addSaleItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-success-600 bg-success-50 px-3 py-1.5 rounded-lg hover:bg-success-100 transition-colors border border-success-100"
                  >
                    <Plus className="w-3 h-3" /> Añadir Ítem
                  </button>
                </div>

                <div className="space-y-3">
                  {saleData.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-surface-50 p-3 rounded-xl border border-surface-200">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-surface-500 uppercase mb-1">Cant</label>
                        <Input 
                          type="number" 
                          min="1"
                          className="text-center px-1"
                          value={item.quantity}
                          onChange={e => updateSaleItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-[10px] font-bold text-surface-500 uppercase mb-1">Descripción</label>
                        <Input 
                          type="text" 
                          placeholder="Mica 9D"
                          className="uppercase px-2"
                          value={item.description}
                          onChange={e => updateSaleItem(item.id, { description: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-surface-500 uppercase mb-1">P. Unit ($)</label>
                        <Input 
                          type="number" 
                          step="0.01"
                          className="font-bold text-center px-1"
                          value={item.price}
                          onChange={e => updateSaleItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-2">
                         <button 
                          type="button"
                          title="Eliminar ítem"
                          onClick={() => removeSaleItem(item.id)}
                          className="w-full aspect-square flex items-center justify-center text-danger-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors border border-transparent hover:border-danger-100"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Config & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-surface-100">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-surface-700 mb-2">Método de Pago</label>
                    <div className="flex gap-2">
                       {['efectivo', 'transferencia'].map(m => (
                         <button
                           key={m}
                           type="button"
                           title={`Seleccionar pago con ${m}`}
                           onClick={() => setSaleData({...saleData, method: m as PaymentMethod})}
                           className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all capitalize ${saleData.method === m ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300'}`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="bg-surface-900 rounded-2xl p-6 text-white flex flex-col justify-center items-center shadow-inner">
                  <p className="text-surface-400 text-sm font-semibold mb-1">TOTAL A PAGAR</p>
                  <h3 className="text-4xl font-black text-white">$
                    {saleData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                  </h3>
                </div>
              </div>
            </form>

            <div className="p-6 bg-surface-50 border-t border-surface-100 flex gap-3 sticky bottom-0 rounded-b-3xl">
               <Button 
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                variant="outline"
                className="flex-1"
               >
                 Cancelar
               </Button>
               <Button 
                type="button"
                onClick={handleCreateSale}
                variant="primary"
                className="flex-1"
                disabled={saveStatus !== 'idle'}
               >
                 {saveStatus === 'saving' ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Procesando...
                   </>
                 ) : saveStatus === 'success' ? (
                   <>
                     <CheckCircle2 className="w-4 h-4" />
                     ¡Éxito!
                   </>
                 ) : 'Procesar & Imprimir'}
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md font-sans">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Transacción Guardada</p>
              <p className="text-xs text-surface-400">
                El registro se ha actualizado correctamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
