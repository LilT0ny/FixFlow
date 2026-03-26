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
  CreditCard,
  Phone
} from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { StatCard } from '../components/molecules/StatCard';
import type { TransactionType, PaymentMethod, PaymentType } from '../types';

export const CashRegister: React.FC = () => {
  const { payments, addPayment } = usePayments();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [search, setSearch] = useState('');

  const filteredPayments = Array.isArray(payments) ? payments.filter(p => {
    const matchesDate = !dateFilter || p.date.split('T')[0] === dateFilter;
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
    <div className="space-y-10 max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-surface-900">
            Arqueo & Tesorería
          </h2>
          <p className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80">
            Control Financiero y Flujo de Caja en Tiempo Real
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => {
              setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
              setIsModalOpen(true);
            }} 
            className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuevo Ingreso
          </button>
          <button 
            onClick={() => {
              setNewPayment({ amount: '', method: 'efectivo', type: 'otro', transactionType: 'egreso', description: '' });
              setIsModalOpen(true);
            }} 
            className="flex-1 md:flex-none bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-200/50 flex items-center justify-center gap-3 hover:bg-rose-700 transition-all active:scale-95"
          >
            <Minus className="w-5 h-5" />
            Registrar Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Efectivo en Caja" amount={totals.efectivo} icon={Wallet} color="text-emerald-600" bgColor="bg-emerald-50" delay="0ms" />
        <StatCard title="Depósitos / Transf." amount={totals.transferencia} icon={ArrowUpRight} color="text-blue-600" bgColor="bg-blue-50" delay="100ms" />
        <StatCard title="Egresos Operativos" amount={totals.egresosTotal} icon={TrendingDown} color="text-rose-600" bgColor="bg-rose-50" delay="200ms" />
        <StatCard title="Balance Consolidado" amount={totals.total} icon={TrendingUp} color="text-primary-600" bgColor="bg-primary-50" delay="300ms" />
      </div>

      <div className="bg-white rounded-[40px] border border-surface-100/50 shadow-2xl shadow-surface-200/30 overflow-hidden animate-zoom-in">
        <div className="p-6 border-b border-surface-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-surface-50/30 backdrop-blur-md">
          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filtro por concepto..."
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-surface-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center relative">
              <CalendarDays className="w-5 h-5 text-primary-500 absolute left-4 z-10 pointer-events-none" />
              <input 
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-white border border-surface-100 rounded-2xl pl-12 pr-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-surface-700 cursor-pointer w-full md:w-auto hover:bg-surface-50 transition-colors shadow-sm outline-none"
              />
            </div>
            
            <div className="flex bg-surface-100/50 p-1.5 rounded-2xl shrink-0 shadow-inner overflow-x-auto no-scrollbar border border-surface-200/20">
              {(['all', 'efectivo', 'transferencia'] as const).map(m => (
                <button 
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-6 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest whitespace-nowrap ${methodFilter === m ? 'bg-white shadow-xl text-primary-600 scale-[1.02]' : 'text-surface-400 hover:text-surface-600'}`}
                >
                  {m === 'all' ? 'Consolidado' : m}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50 text-[10px] font-black text-surface-400 uppercase tracking-[0.25em] border-b border-surface-100">
                <th className="px-8 py-5 text-center w-24">Tipo</th>
                <th className="px-8 py-5">Temporalidad</th>
                <th className="px-8 py-5">Segmento</th>
                <th className="px-8 py-5">Concepto / Referencia</th>
                <th className="px-8 py-5">Canal</th>
                <th className="px-8 py-5 text-right">Monto Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {filteredPayments.map((p, idx) => (
                <tr key={p.id} style={{ animationDelay: `${idx * 40}ms` }} className="hover:bg-surface-50/50 transition-colors group animate-in fade-in slide-in-from-left-4">
                  <td className="px-8 py-6 text-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto shadow-sm transition-transform group-hover:scale-110 ${
                      p.transactionType === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {p.transactionType === 'ingreso' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-black text-surface-900 uppercase tracking-tighter">
                      {new Date(p.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-[10px] text-surface-400 font-bold opacity-70">
                      {new Date(p.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] text-surface-500 font-black uppercase tracking-widest bg-surface-100/50 px-2.5 py-1 rounded-lg border border-surface-200/30">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-surface-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{p.description}</div>
                    {p.customer && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-surface-400 bg-surface-50 px-2 py-1 rounded-lg border border-surface-100 uppercase tracking-tight">
                          <CreditCard className="w-3 h-3 text-primary-400" />
                          {p.customer.documentId || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-surface-400 font-black uppercase tracking-widest opacity-60">
                          <Phone className="w-3 h-3" />
                          {p.customer.phone || 'N/A'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase bg-white border border-surface-100 px-3 py-1.5 rounded-xl text-surface-500 shadow-sm">
                      {p.method}
                    </span>
                  </td>
                  <td className={`px-8 py-6 text-right ${
                    p.transactionType === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    <span className="text-2xl font-black tracking-tighter">${p.amount.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="w-24 h-24 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-surface-100">
                       <Search className="w-10 h-10 text-surface-200 opacity-50" />
                    </div>
                    <h4 className="text-lg font-black text-surface-900 tracking-tight">Sin correspondencias</h4>
                    <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mt-2">Prueba con otros parámetros de búsqueda</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-md z-[100] flex justify-center items-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md animate-zoom-in overflow-hidden border border-white/20">
            <div className="px-10 py-8 border-b border-surface-50 bg-surface-50/30 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${newPayment.transactionType === 'ingreso' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {newPayment.transactionType === 'ingreso' ? <Plus className="w-7 h-7" /> : <Minus className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-surface-900 tracking-tight leading-none">
                    {newPayment.transactionType === 'ingreso' ? 'Captar Ingreso' : 'Registrar Salida'}
                  </h3>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mt-2 opacity-60">Operación Manual de Caja</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-100 rounded-full transition-all text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePayment} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Monto de la Operación</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-surface-300 text-2xl group-focus-within:text-primary-500 transition-colors">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-surface-50 border border-surface-100 rounded-[28px] pl-12 pr-8 py-6 text-4xl font-black focus:ring-[12px] focus:ring-primary-500/5 focus:border-primary-500/30 transition-all outline-none tracking-tighter shadow-inner"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Concepto o Destino</label>
                <input 
                  type="text"
                  placeholder="Ej: COMPRA DE PANTALLAS IPHONE 15..."
                  className="w-full bg-white border border-surface-100 rounded-2xl px-6 py-4 text-sm font-black uppercase focus:ring-4 focus:ring-primary-500/10 transition-all outline-none shadow-sm"
                  value={newPayment.description}
                  onChange={e => setNewPayment({...newPayment, description: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Medio de Pago</label>
                  <select 
                    className="w-full bg-surface-50 border border-surface-100 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                    value={newPayment.method}
                    onChange={e => setNewPayment({...newPayment, method: e.target.value as PaymentMethod})}
                  >
                    <option value="efectivo">EFECTIVO</option>
                    <option value="transferencia">BANCO / TRANSF</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Clasificación</label>
                  <select 
                    className="w-full bg-surface-50 border border-surface-100 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                    value={newPayment.type}
                    onChange={e => setNewPayment({...newPayment, type: e.target.value as PaymentType})}
                  >
                    <option value="reparacion">SERVICIO TÉCNICO</option>
                    <option value="repuestos">ADQUISICIÓN REPUESTOS</option>
                    <option value="insumos">SUMINISTROS</option>
                    <option value="otro">OTRO CONCEPTO</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-surface-100 text-surface-500 hover:bg-surface-200 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`flex-[2] text-white font-black py-4 rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest ${newPayment.transactionType === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50'}`}
                  disabled={saveStatus !== 'idle'}
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Guardar Movimiento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Movimiento Registrado</p>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mt-1">La transacción se ha sincronizado correctamente</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister;
