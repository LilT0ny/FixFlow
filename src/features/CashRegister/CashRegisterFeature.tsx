import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CalendarDays,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  X,
  CreditCard
} from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import { StatCard } from '../../components/molecules/StatCard';
import { PageHeader } from '../../components/design-system';
import { getLocalDate, formatToLocalDate } from '../../utils/dateUtils';
import type { TransactionType, PaymentMethod, PaymentType } from '../../types';

export const CashRegisterFeature: React.FC = () => {
  const { payments, addPayment } = usePayments();
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [search, setSearch] = useState('');

  const filteredPayments = Array.isArray(payments) ? payments.filter(p => {
    const pDateLocal = formatToLocalDate(p.date);
    const matchesDate = !dateFilter || pDateLocal === dateFilter;
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    const matchesSearch = !search || 
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.amount.toString().includes(search);
    return matchesDate && matchesMethod && matchesSearch;
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Transacciones"
        subtitle="Control financiero y flujo de caja en tiempo real"
      >
        <button
          onClick={() => {
            setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-success-600 text-white px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-success-700 transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo ingreso
        </button>
        <button
          onClick={() => {
            setNewPayment({ amount: '', method: 'efectivo', type: 'otro', transactionType: 'egreso', description: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-white border border-surface-300 text-danger-600 px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-danger-50 hover:border-danger-200 transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
        >
          <Minus className="w-4 h-4" />
          Registrar gasto
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Efectivo en caja" amount={totals.efectivo} icon={Wallet} color="text-emerald-600" bgColor="bg-emerald-50" delay="0ms" />
        <StatCard title="Depósitos / Transf." amount={totals.transferencia} icon={ArrowUpRight} color="text-blue-600" bgColor="bg-blue-50" delay="60ms" />
        <StatCard title="Egresos operativos" amount={totals.egresosTotal} icon={TrendingDown} color="text-rose-600" bgColor="bg-rose-50" delay="120ms" />
        <StatCard title="Balance consolidado" amount={totals.total} icon={TrendingUp} color="text-primary-600" bgColor="bg-primary-50" delay="180ms" />
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-surface-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative w-full lg:w-[360px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4 group-focus-within:text-primary-600 transition-colors duration-150" />
            <input
              type="text"
              placeholder="Filtrar por concepto..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            <div className="flex items-center relative w-full sm:w-auto min-w-[170px] bg-white border border-surface-300 rounded-lg px-3 py-2 hover:border-surface-400 transition-colors duration-150">
              <CalendarDays className="w-4 h-4 text-surface-500 absolute left-3 z-10 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full pl-8 pr-2 bg-transparent text-sm font-medium text-surface-700 cursor-pointer outline-none block"
              />
            </div>

            <div className="flex bg-surface-100 p-1 rounded-lg shrink-0 overflow-x-auto">
              {(['all', 'efectivo', 'transferencia'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-colors duration-150 capitalize whitespace-nowrap ${methodFilter === m ? 'bg-white shadow-xs text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
                >
                  {m === 'all' ? 'Consolidado' : m}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200">
                <th className="px-4 md:px-6 py-3 text-center w-16">Tipo</th>
                <th className="px-4 md:px-6 py-3 hidden md:table-cell">Fecha</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Segmento</th>
                <th className="px-4 md:px-6 py-3">Concepto</th>
                <th className="px-4 md:px-6 py-3 hidden lg:table-cell">Canal</th>
                <th className="px-4 md:px-6 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50 transition-colors duration-150">
                  <td className="px-4 md:px-6 py-3.5 text-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                      p.transactionType === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {p.transactionType === 'ingreso' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden md:table-cell">
                    <div className="text-sm text-surface-600">
                      {new Date(p.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                    <span className="text-xs font-medium text-surface-600 capitalize bg-surface-100 px-2 py-0.5 rounded-md">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5">
                    <div className="text-sm font-medium text-surface-900 truncate max-w-[160px] md:max-w-none">{p.description}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                       <div className="md:hidden text-xs text-surface-400">
                          {new Date(p.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                       </div>
                       {p.customer && (
                         <div className="flex items-center gap-1 text-xs text-surface-500">
                           <CreditCard className="w-3 h-3" />
                           {p.customer.documentId || 'N/A'}
                         </div>
                       )}
                       <div className="lg:hidden text-xs text-surface-500 capitalize">
                          {p.method}
                       </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-xs font-medium capitalize bg-surface-100 px-2 py-0.5 rounded-md text-surface-600">
                      {p.method}
                    </span>
                  </td>
                  <td className={`px-4 md:px-6 py-3.5 text-right whitespace-nowrap ${
                    p.transactionType === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    <span className="text-base font-semibold tracking-tight">
                      {p.transactionType === 'ingreso' ? '+' : '-'}${Math.abs(p.amount).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search className="w-5 h-5 text-surface-400" />
                    </div>
                    <h4 className="text-base font-semibold text-surface-900">Sin movimientos</h4>
                    <p className="text-sm text-surface-500 mt-1">Probá con otros parámetros de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-900/40 z-[100] flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-surface-200 shadow-lg w-full max-w-md animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newPayment.transactionType === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {newPayment.transactionType === 'ingreso' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 leading-tight">
                    {newPayment.transactionType === 'ingreso' ? 'Nuevo ingreso' : 'Registrar gasto'}
                  </h3>
                  <p className="text-sm text-surface-500">Operación manual de caja</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-100 rounded-lg transition-colors duration-150 text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">Monto de la operación</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-xl group-focus-within:text-primary-600 transition-colors duration-150">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-white border border-surface-300 rounded-lg pl-9 pr-4 py-3 text-2xl font-semibold tracking-tight focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">Concepto o destino</label>
                <input
                  type="text"
                  placeholder="Ej: Compra de pantallas iPhone 15..."
                  className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                  value={newPayment.description}
                  onChange={e => setNewPayment({...newPayment, description: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">Medio de pago</label>
                  <select
                    className="w-full bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                    value={newPayment.method}
                    onChange={e => setNewPayment({...newPayment, method: e.target.value as PaymentMethod})}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Banco / Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">Clasificación</label>
                  <select
                    className="w-full bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                    value={newPayment.type}
                    onChange={e => setNewPayment({...newPayment, type: e.target.value as PaymentType})}
                  >
                    <option value="reparacion">Servicio técnico</option>
                    <option value="repuestos">Adquisición de repuestos</option>
                    <option value="insumos">Suministros</option>
                    <option value="otro">Otro concepto</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 h-11 rounded-lg text-sm font-medium border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 transition-colors duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-[2] text-white text-sm font-medium h-11 rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${newPayment.transactionType === 'ingreso' ? 'bg-success-600 hover:bg-success-700' : 'bg-danger-600 hover:bg-danger-700'}`}
                  disabled={saveStatus !== 'idle'}
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Guardar movimiento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] animate-fade-in-up">
          <div className="bg-surface-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-full shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Movimiento registrado</p>
              <p className="text-xs text-surface-300 mt-0.5">La transacción se sincronizó correctamente</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegisterFeature;
