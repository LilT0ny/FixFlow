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
  Filter,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">Transacciones</h2>
          <p className="text-gray-500 mt-1">Administra el flujo de dinero, ingresos y egresos diarios.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
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

      {/* Controls */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center relative w-full sm:w-auto">
          <CalendarDays className="w-5 h-5 text-gray-400 absolute left-3 z-10 pointer-events-none" />
          <input 
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-transparent border-none outline-none ring-0 focus:ring-0 pl-10 pr-2 py-1 text-sm font-medium text-surface-700 cursor-pointer appearance-none"
          />
        </div>
        
        <div className="flex bg-surface-100 p-1 rounded-xl w-full sm:w-auto shrink-0 shadow-inner">
          {['all', 'efectivo', 'transferencia'].map(m => (
            <button 
              key={m}
              onClick={() => setMethodFilter(m as any)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${methodFilter === m ? 'bg-white shadow-sm text-surface-900 border border-surface-200' : 'text-surface-500 hover:text-surface-700'}`}
            >
              {m === 'all' ? 'Todos' : m}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Buscar descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Efectivo" amount={totals.efectivo} icon={Wallet} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Total Transferencia" amount={totals.transferencia} icon={ArrowUpRight} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="Egresos Totales" amount={totals.egresosTotal} icon={TrendingDown} color="text-rose-600" bgColor="bg-rose-50" />
        <StatCard title="Balance Neto" amount={totals.total} icon={TrendingUp} color="text-primary-600" bgColor="bg-primary-50" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {new Date(p.date).toLocaleString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      p.transactionType === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {p.transactionType === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{p.description}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase bg-gray-100 px-2 py-1 rounded-lg text-gray-500">
                      {p.method}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${
                    p.transactionType === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {p.transactionType === 'ingreso' ? '+' : '-'}${p.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Filter className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No hay registros que coincidan con los filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {newPayment.transactionType === 'ingreso' ? <Plus className="w-6 h-6 text-emerald-600" /> : <Minus className="w-6 h-6 text-rose-600" />}
                Registrar {newPayment.transactionType === 'ingreso' ? 'Ingreso' : 'Egreso'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePayment} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8 text-2xl font-black"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                <Input 
                  placeholder="Ej: Cobro de reparación #123"
                  className="font-bold uppercase"
                  value={newPayment.description}
                  onChange={e => setNewPayment({...newPayment, description: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Método</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold appearance-none cursor-pointer"
                    value={newPayment.method}
                    onChange={e => setNewPayment({...newPayment, method: e.target.value as PaymentMethod})}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold appearance-none cursor-pointer"
                    value={newPayment.type}
                    onChange={e => setNewPayment({...newPayment, type: e.target.value as PaymentType})}
                  >
                    <option value="reparacion">Reparación</option>
                    <option value="repuestos">Repuestos</option>
                    <option value="insumos">Insumos/Gastos</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
                <Button 
                  type="submit" 
                  className={`flex-1 text-white font-black h-12 rounded-2xl ${newPayment.transactionType === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                  disabled={saveStatus !== 'idle'}
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border border-gray-700">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            Registro guardado con éxito
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, amount, icon: Icon, color, bgColor }: any) => (
  <Card className="p-5 flex items-center gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className={`${bgColor} ${color} p-3 rounded-2xl`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-black text-surface-900">${amount.toFixed(2)}</h3>
    </div>
  </Card>
);
