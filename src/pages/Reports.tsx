import { useState, useMemo } from "react";
import { useAppContext } from "../store/AppContext";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  CalendarDays,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";

export const Reports = () => {
  const { payments } = useAppContext();

  // View states
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("monthly");
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "success"
  >("idle");

  // Date selection states
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0],
  );

  // Derived data based on current view
  const filteredData = useMemo(() => {
    if (viewMode === "monthly") {
      return payments.filter((p) => p.date.startsWith(selectedMonth));
    } else {
      return payments.filter((p) => p.date.startsWith(selectedDate));
    }
  }, [payments, viewMode, selectedMonth, selectedDate]);

  // Calculations for Net Balance
  const totalIncome = filteredData
    .filter((p) => p.transactionType === "ingreso")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = filteredData
    .filter((p) => p.transactionType === "egreso")
    .reduce((sum, p) => sum + p.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Monthly Aggregation for Chart
  const chartData = useMemo(() => {
    if (viewMode !== "monthly") return [];

    const daysMap = new Map<
      string,
      { name: string; Ingresos: number; Egresos: number }
    >();

    const year = parseInt(selectedMonth.split("-")[0]);
    const month = parseInt(selectedMonth.split("-")[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${selectedMonth}-${String(i).padStart(2, "0")}`;
      daysMap.set(dayStr, { name: String(i), Ingresos: 0, Egresos: 0 });
    }

    filteredData.forEach((p) => {
      const dayStr = p.date.split("T")[0];
      const existing = daysMap.get(dayStr);
      if (existing) {
        if (p.transactionType === "ingreso") existing.Ingresos += p.amount;
        else existing.Egresos += p.amount;
      }
    });

    return Array.from(daysMap.values());
  }, [filteredData, viewMode, selectedMonth]);

  const exportToExcel = () => {
    setExportStatus("exporting");

    setTimeout(() => {
      const formattedData = filteredData.map((p) => ({
        Fecha: new Date(p.date).toLocaleString(),
        Concepto: p.description || "Sin descripcion",
        Tipo: p.transactionType.toUpperCase(),
        Categoria: p.type,
        "Metodo de Pago": p.method,
        Valor: p.transactionType === "egreso" ? -p.amount : p.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

      const fileName =
        viewMode === "monthly"
          ? `Reporte_${selectedMonth}.xlsx`
          : `Reporte_${selectedDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportStatus("success");
      setTimeout(() => setExportStatus("idle"), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-surface-900">
            Reportes & Análisis
          </h2>
          <p className="text-surface-500 mt-1 uppercase text-[10px] font-black tracking-[0.2em]">
            Visión Estratégica del Negocio
          </p>
        </div>

        <button
          onClick={exportToExcel}
          disabled={exportStatus !== "idle"}
          className={`px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 ${exportStatus === "success"
            ? "bg-emerald-600 text-white shadow-emerald-100"
            : "bg-[#10b981] text-white hover:bg-emerald-700 shadow-emerald-100"
          }`}
        >
          {exportStatus === "exporting" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : exportStatus === "success" ? (
            <>
              <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" />
              ¡Listo!
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar Excel
            </>
          )}
        </button>
      </div>

      {/* Floating Toast Notification */}
      {exportStatus === "success" && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Reporte Generado</p>
              <p className="text-[10px] text-surface-400 uppercase tracking-widest mt-1">El archivo se ha descargado correctamente</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-700">
        <div className="bg-white p-8 rounded-[32px] border border-surface-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500 group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12">
               <Download className="w-5 h-5 rotate-180" />
            </div>
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-1">
              Flujo de Ingresos
            </p>
          </div>
          <h3 className="text-4xl font-black text-surface-900 tracking-tighter">
            <span className="text-xl mr-1 text-emerald-500 font-bold">$</span>{totalIncome.toFixed(2)}
          </h3>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] border border-surface-200 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500 group">
          <div>
             <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12">
               <Download className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-1">
              Flujo de Egresos
            </p>
          </div>
          <h3 className="text-4xl font-black text-surface-900 tracking-tighter">
            <span className="text-xl mr-1 text-red-500 font-bold">$</span>{totalExpense.toFixed(2)}
          </h3>
        </div>

        <div className={`p-8 rounded-[32px] shadow-2xl flex flex-col justify-between hover:scale-[1.05] transition-all duration-500 group relative overflow-hidden ${netBalance >= 0 ? "bg-surface-900 text-white shadow-surface-200" : "bg-red-600 text-white shadow-red-200"}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12 ${netBalance >= 0 ? "bg-white/10" : "bg-white/20"}`}>
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">
              Utilidad Neta
            </p>
          </div>
          <h3 className="text-4xl font-black tracking-tighter">
            <span className="text-xl mr-1 opacity-70 font-bold">$</span>{netBalance.toFixed(2)}
          </h3>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "monthly" ? (
        <div className="bg-white p-8 rounded-[32px] border border-surface-200 shadow-sm animate-in zoom-in-95 duration-700 delay-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">            <div>
              <h3 className="text-xl font-black text-surface-900 tracking-tight">
                Análisis de Movimientos
              </h3>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-1">Tendencia de Ingresos vs Egresos</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-wider">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-wider">Egresos</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} 
                    dx={-15}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "20px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      padding: "12px 16px"
                    }}
                    itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '6px', fontSize: '11px', color: '#1e293b' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Ingresos"
                    stroke="#10B981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorIngresos)"
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="Egresos"
                    stroke="#EF4444"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorEgresos)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-surface-300 gap-3 opacity-50">
                <CalendarDays className="w-12 h-12" />
                <p className="text-[11px] font-black uppercase tracking-widest">Sin datos históricos en este periodo</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-surface-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
          <div className="px-8 py-6 border-b border-surface-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-black text-surface-900 tracking-tight">Detalle de Transacciones</h3>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">Operaciones Registradas el {selectedDate}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-50/50">
                  <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100">Hora</th>
                  <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100">Concepto / Descripción</th>
                  <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100 hidden md:table-cell">Categoría</th>
                  <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100 hidden sm:table-cell">Método</th>
                  <th className="px-8 py-4 text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] border-b border-surface-100 text-right">Monto Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredData.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface-50/70 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-[11px] font-black text-surface-400">
                      <div className="bg-surface-100 px-3 py-1.5 rounded-xl border border-surface-200/50 text-surface-700 shadow-sm inline-block">
                        {new Date(payment.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-surface-900 leading-none">
                        {payment.description || "Sin descripción"}
                      </div>
                      <p className="text-[10px] text-surface-400 mt-2 font-medium leading-none flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${payment.transactionType === "ingreso" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                        {payment.transactionType === "ingreso" ? 'ENTRADA' : 'SALIDA'}
                      </p>
                    </td>
                    <td className="px-8 py-5 hidden md:table-cell">
                      <span className="text-[10px] font-black uppercase tracking-widest text-surface-500 bg-surface-50 border border-surface-100 px-2.5 py-1 rounded-lg">
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap hidden sm:table-cell">
                      <span className="text-[10px] font-black uppercase tracking-tight text-surface-600">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <span className={`font-black tracking-tighter text-xl ${payment.transactionType === "egreso" ? "text-red-500" : "text-emerald-600"}`}>
                        {payment.transactionType === "egreso" ? "-" : "+"}${payment.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                       <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                        <CalendarDays className="w-12 h-12 text-surface-300" />
                        <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                          Sin movimientos registrados
                        </p>
                      </div>
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
