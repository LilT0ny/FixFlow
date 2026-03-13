import { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, BarChart3, ListTree } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Reports = () => {
  const { payments } = useAppContext();
  
  // View states
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly');
  
  // Date selection states
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  // Derived data based on current view
  const filteredData = useMemo(() => {
    if (viewMode === 'monthly') {
      return payments.filter(p => p.date.startsWith(selectedMonth));
    } else {
      return payments.filter(p => p.date.startsWith(selectedDate));
    }
  }, [payments, viewMode, selectedMonth, selectedDate]);

  // Calculations for Net Balance
  const totalIncome = filteredData.filter(p => p.transactionType === 'ingreso').reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = filteredData.filter(p => p.transactionType === 'egreso').reduce((sum, p) => sum + p.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Monthly Aggregation for Chart
  const chartData = useMemo(() => {
    if (viewMode !== 'monthly') return [];
    
    // Group by day
    const daysMap = new Map<string, { name: string; Ingresos: number; Egresos: number }>();
    
    // Initialize all days in the month up to the last day
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
        daysMap.set(dayStr, { name: String(i), Ingresos: 0, Egresos: 0 });
    }

    filteredData.forEach(p => {
        const dayStr = p.date.split('T')[0];
        const existing = daysMap.get(dayStr);
        if (existing) {
            if (p.transactionType === 'ingreso') existing.Ingresos += p.amount;
            else existing.Egresos += p.amount;
        }
    });

    return Array.from(daysMap.values());
  }, [filteredData, viewMode, selectedMonth]);


  const exportToExcel = () => {
    const formattedData = filteredData.map(p => ({
        Fecha: new Date(p.date).toLocaleString(),
        Concepto: p.description || 'Sin descripción',
        Tipo: p.transactionType.toUpperCase(),
        Categoria: p.type,
        'Método de Pago': p.method,
        Valor: p.transactionType === 'egreso' ? -p.amount : p.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    
    const fileName = viewMode === 'monthly' ? `Reporte_${selectedMonth}.xlsx` : `Reporte_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Reportes y Estadísticas</h2>
          <p className="text-gray-500 mt-1">Analiza los ingresos y egresos de tu negocio.</p>
        </div>
        
        <button 
          onClick={exportToExcel}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm flex items-center gap-2 hover:bg-green-700 transition"
        >
          <Download className="w-5 h-5" />
          Exportar Excel
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto shrink-0 shadow-inner">
          <button 
            onClick={() => setViewMode('monthly')}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BarChart3 className="w-4 h-4" /> Mensual
          </button>
          <button 
            onClick={() => setViewMode('daily')}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'daily' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ListTree className="w-4 h-4" /> Diario
          </button>
        </div>
        
        <div className="flex gap-2 items-center flex-1 w-full sm:w-auto relative justify-end">
          <Calendar className="w-5 h-5 text-gray-400 absolute left-3 z-10" />
          {viewMode === 'monthly' ? (
             <input 
               type="month"
               value={selectedMonth}
               onChange={e => setSelectedMonth(e.target.value)}
               className="pl-10 pr-4 py-2 w-full sm:w-auto border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700"
             />
          ) : (
             <input 
               type="date"
               value={selectedDate}
               onChange={e => setSelectedDate(e.target.value)}
               className="pl-10 pr-4 py-2 w-full sm:w-auto border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-700"
             />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-emerald-600 mb-1">Total Ingresos</p>
            <h3 className="text-3xl font-bold text-gray-900">${totalIncome.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-red-600 mb-1">Total Egresos</p>
            <h3 className="text-3xl font-bold text-gray-900">${totalExpense.toFixed(2)}</h3>
          </div>
          <div className={`p-6 rounded-2xl shadow-sm flex flex-col justify-between ${netBalance >= 0 ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'}`}>
            <p className="text-sm font-semibold text-white/80 mb-1">Balance Neto</p>
            <h3 className="text-3xl font-bold">${netBalance.toFixed(2)}</h3>
          </div>
      </div>

      {/* Content Area */}
      {viewMode === 'monthly' ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-6">Flujo de Caja - {selectedMonth}</h3>
             <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                      <Tooltip 
                        cursor={{fill: '#F3F4F6'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend wrapperStyle={{paddingTop: '20px'}} />
                      <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No hay datos para mostrar en este mes.
                  </div>
                )}
             </div>
          </div>
      ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Listado Diario - {selectedDate}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold">Hora</th>
                    <th className="px-6 py-4 font-semibold">Concepto</th>
                    <th className="px-6 py-4 font-semibold">Categoría</th>
                    <th className="px-6 py-4 font-semibold">Método</th>
                    <th className="px-6 py-4 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{payment.description || 'Sin descripción'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm capitalize text-gray-600">{payment.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-gray-600">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`font-bold text-lg ${payment.transactionType === 'egreso' ? 'text-red-500' : 'text-emerald-600'}`}>
                          {payment.transactionType === 'egreso' ? '-' : '+'}${payment.amount.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No se registraron movimientos en esta fecha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      )}
    </div>
  );
};
