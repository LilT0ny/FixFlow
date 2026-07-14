import React, { useState } from 'react';
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
  CreditCard,
  Printer
} from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import { StatCard } from '../../components/molecules/StatCard';
import { PageHeader } from '../../components/design-system';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';
import { getLocalDate, formatToLocalDate } from '../../utils/dateUtils';
import { useSettings } from '../../hooks/useSettings';
import { printReceipt } from '../../utils/printHelpers';
import { useToast } from '../../store/ToastContext';
import type { TransactionType, PaymentMethod, PaymentType, PaymentTransaction, ServiceOrder } from '../../types';

/** Reconstruye un objeto imprimible a partir del ingreso de una nota de
 *  venta — la única fuente de verdad post-creación es esta transacción,
 *  ya que la nota en sí no tiene vista propia en la app. */
function printNotaFromPayment(p: PaymentTransaction, format: string, settings: ReturnType<typeof useSettings>['settings']) {
  printReceipt(
    {
      orderNumber: p.saleNumber,
      createdAt: p.date,
      customer: p.customer || { fullName: 'CONSUMIDOR FINAL', documentId: '9999999999999', phone: '', address: '' },
      repair: { reportedIssue: '', repairTotalCost: p.amount, evidencePhotos: [] },
      items: p.items,
    } as unknown as ServiceOrder,
    format,
    'nota-venta',
    false,
    settings
  );
}

export const CashRegisterFeature: React.FC = () => {
  const { payments, addPayment } = usePayments();
  const { settings } = useSettings();
  const { showToast } = useToast();
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

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.amount || isNaN(Number(newPayment.amount))) return;

    setSaveStatus('saving');

    try {
      await addPayment({
        amount: Number(newPayment.amount),
        method: newPayment.method,
        type: newPayment.type,
        transactionType: newPayment.transactionType,
        description: newPayment.description
      });

      setSaveStatus('success');
      showToast('Movimiento registrado correctamente', 'success');

      setTimeout(() => {
        setIsModalOpen(false);
        setSaveStatus('idle');
        setNewPayment({ amount: '', method: 'efectivo', type: 'reparacion', transactionType: 'ingreso', description: '' });
      }, 1500);
    } catch {
      // El error ya se muestra vía toast desde usePayments.addPayment
      setSaveStatus('idle');
    }
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
          className="w-full sm:w-auto bg-white border border-surface-300 text-danger-600 px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-danger-50 hover:border-danger-200 transition-all duration-150 active:scale-[0.98] whitespace-nowrap dark:bg-gray-900 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-900"
        >
          <Minus className="w-4 h-4" />
          Registrar gasto
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Efectivo en caja" amount={totals.efectivo} icon={Wallet} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-50 dark:bg-emerald-950/40" delay="0ms" />
        <StatCard title="Depósitos / Transf." amount={totals.transferencia} icon={ArrowUpRight} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-50 dark:bg-blue-950/40" delay="60ms" />
        <StatCard title="Egresos operativos" amount={totals.egresosTotal} icon={TrendingDown} color="text-rose-600 dark:text-rose-400" bgColor="bg-rose-50 dark:bg-rose-950/40" delay="120ms" />
        <StatCard title="Balance consolidado" amount={totals.total} icon={TrendingUp} color="text-primary-600 dark:text-blue-400" bgColor="bg-primary-50 dark:bg-blue-950/40" delay="180ms" />
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden animate-fade-in-up dark:bg-gray-900 dark:border-gray-800">
        <div className="p-4 border-b border-surface-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between dark:border-gray-800">
          <div className="relative w-full lg:w-[360px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4 group-focus-within:text-primary-600 transition-colors duration-150 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Filtrar por concepto..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            <div className="flex items-center relative w-full sm:w-auto min-w-[170px] bg-white border border-surface-300 rounded-lg px-3 py-2 hover:border-surface-400 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600">
              <CalendarDays className="w-4 h-4 text-surface-500 absolute left-3 z-10 pointer-events-none dark:text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full pl-8 pr-2 bg-transparent text-sm font-medium text-surface-700 cursor-pointer outline-none block dark:text-gray-300"
              />
            </div>

            <div className="flex bg-surface-100 p-1 rounded-lg shrink-0 overflow-x-auto dark:bg-gray-800">
              {(['all', 'efectivo', 'transferencia'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-colors duration-150 capitalize whitespace-nowrap ${methodFilter === m ? 'bg-white shadow-xs text-surface-900 dark:bg-gray-900 dark:text-gray-100' : 'text-surface-500 hover:text-surface-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
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
              <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800">
                <th className="px-4 md:px-6 py-3 text-center w-16">Tipo</th>
                <th className="px-4 md:px-6 py-3 hidden md:table-cell">Fecha</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Segmento</th>
                <th className="px-4 md:px-6 py-3">Concepto</th>
                <th className="px-4 md:px-6 py-3 hidden lg:table-cell">Canal</th>
                <th className="px-4 md:px-6 py-3 text-right">Monto</th>
                <th className="px-4 md:px-6 py-3 w-12"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50 transition-colors duration-150 dark:hover:bg-gray-800/60">
                  <td className="px-4 md:px-6 py-3.5 text-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                      p.transactionType === 'ingreso' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                      {p.transactionType === 'ingreso' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden md:table-cell">
                    <div className="text-sm text-surface-600 dark:text-gray-400">
                      {new Date(p.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                    <span className="text-xs font-medium text-surface-600 capitalize bg-surface-100 px-2 py-0.5 rounded-md dark:text-gray-400 dark:bg-gray-800">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-surface-900 truncate max-w-[160px] md:max-w-none dark:text-gray-100">{p.description}</div>
                      {p.saleNumber && (
                        <span className="shrink-0 text-[10px] font-mono font-medium bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded border border-primary-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900">
                          {p.saleNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                       <div className="md:hidden text-xs text-surface-400 dark:text-gray-500">
                          {new Date(p.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                       </div>
                       {p.customer && (
                         <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-gray-400">
                           <CreditCard className="w-3 h-3" />
                           {p.customer.documentId || 'N/A'}
                         </div>
                       )}
                       <div className="lg:hidden text-xs text-surface-500 capitalize dark:text-gray-400">
                          {p.method}
                       </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-xs font-medium capitalize bg-surface-100 px-2 py-0.5 rounded-md text-surface-600 dark:bg-gray-800 dark:text-gray-400">
                      {p.method}
                    </span>
                  </td>
                  <td className={`px-4 md:px-6 py-3.5 text-right whitespace-nowrap ${
                    p.transactionType === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <span className="text-base font-semibold tracking-tight">
                      {p.transactionType === 'ingreso' ? '+' : '-'}${Math.abs(p.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 text-right">
                    {p.saleNumber && (
                      <button
                        onClick={() => printNotaFromPayment(p, settings.printerType || '80mm', settings)}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-150 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                        title={`Reimprimir nota ${p.saleNumber}`}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
                       <Search className="w-5 h-5 text-surface-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-base font-semibold text-surface-900 dark:text-gray-100">Sin movimientos</h4>
                    <p className="text-sm text-surface-500 mt-1 dark:text-gray-400">Probá con otros parámetros de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader
          title={newPayment.transactionType === 'ingreso' ? 'Nuevo ingreso' : 'Registrar gasto'}
          subtitle="Operación manual de caja"
          icon={newPayment.transactionType === 'ingreso' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
          iconClassName={newPayment.transactionType === 'ingreso' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}
          onClose={() => setIsModalOpen(false)}
          closeDisabled={saveStatus !== 'idle'}
        />

        <form onSubmit={handleCreatePayment} className="contents">
          <ModalBody className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Monto de la operación</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-xl group-focus-within:text-primary-600 transition-colors duration-150 dark:text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-white border border-surface-300 rounded-lg pl-9 pr-4 py-3 text-2xl font-semibold tracking-tight focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  value={newPayment.amount}
                  onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Concepto o destino</label>
              <input
                type="text"
                placeholder="Ej: Compra de pantallas iPhone 15..."
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={newPayment.description}
                onChange={e => setNewPayment({...newPayment, description: e.target.value.toUpperCase()})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Medio de pago</label>
                <select
                  className="w-full bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  value={newPayment.method}
                  onChange={e => setNewPayment({...newPayment, method: e.target.value as PaymentMethod})}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Banco / Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Clasificación</label>
                <select
                  className="w-full bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-11 rounded-lg text-sm font-medium border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 transition-colors duration-150 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default CashRegisterFeature;
