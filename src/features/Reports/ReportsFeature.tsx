import React, { useState, useMemo } from "react";
import { useAppContext } from "../../store/AppContext";
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
  BarChart3,
  ListTree,
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { StatCard } from "../../components/molecules/StatCard";

export const ReportsFeature: React.FC = () => {
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
  const ingresos = filteredData.filter(p => p.transactionType === "ingreso");
  const egresos = filteredData.filter(p => p.transactionType === "egreso");
  
  const totals = {
    ingresosTotal: ingresos.reduce((acc, p) => acc + p.amount, 0),
    egresosTotal: egresos.reduce((acc, p) => acc + p.amount, 0),
    balance: ingresos.reduce((acc, p) => acc + p.amount, 0) - egresos.reduce((acc, p) => acc + p.amount, 0),
  };

  // Chart data for monthly view
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
    <div className="space-y-10 max-w-[1600px] mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-surface-900 leading-tight">
            Reportes y Estadisticas
          </h2>
          <p className="text-[10px] md:text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80 leading-relaxed">
            Analiza los Ingresos y Egresos de tu Negocio
          </p>
        </div>
        
        <button 
          onClick={exportToExcel}
          disabled={exportStatus !== "idle"}
          className={`px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95 disabled:opacity-50 ${
            exportStatus === "success"
              ? "bg-emerald-100 text-emerald-700 shadow-emerald-200/50"
              : "bg-green-600 text-white hover:bg-green-700 shadow-green-200/50"
          }`}
        >
          {exportStatus === "exporting" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : exportStatus === "success" ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Completado
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Exportar Excel
            </>
          )}
        </button>
      </div>

      {/* Success Toast */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Ingresos" amount={totals.ingresosTotal} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" delay="0ms" />
        <StatCard title="Total Egresos" amount={totals.egresosTotal} icon={TrendingDown} color="text-rose-600" bgColor="bg-rose-50" delay="100ms" />
        <StatCard title="Balance Neto" amount={totals.balance} icon={Wallet} color={totals.balance >= 0 ? "text-blue-600" : "text-rose-600"} bgColor={totals.balance >= 0 ? "bg-blue-50" : "bg-rose-50"} delay="200ms" />
        <StatCard title="Transacciones" amount={filteredData.length} icon={ArrowUpRight} color="text-primary-600" bgColor="bg-primary-50" delay="300ms" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[24px] md:rounded-[40px] border border-surface-100/50 shadow-2xl shadow-surface-200/30 overflow-hidden animate-zoom-in">
        <div className="p-4 md:p-6 border-b border-surface-50 flex flex-col lg:flex-row gap-4 md:gap-6 items-center justify-between bg-surface-50/30 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
            <div className="flex items-center relative w-full sm:w-auto min-w-[180px] bg-white border border-surface-200 rounded-2xl px-4 py-3 hover:bg-surface-50 transition-all group shadow-sm">
              <CalendarDays className="w-5 h-5 text-primary-500 absolute left-4 z-10 pointer-events-none group-hover:scale-110 transition-transform" />
              {viewMode === "monthly" ? (
                <div className="relative group flex items-center w-full">
                  <span className="pl-10 pr-2 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-surface-700 w-full text-center">
                    {format(parseISO(`${selectedMonth}-01`), "MMMM yyyy", {
                      locale: es,
                    })}
                  </span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              ) : (
                <div className="relative group flex items-center w-full">
                  <span className="pl-10 pr-2 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-surface-700 w-full text-center">
                    {format(parseISO(selectedDate), "dd MMM, yyyy", {
                      locale: es,
                    })}
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex bg-surface-100/50 p-1 rounded-xl md:rounded-2xl shrink-0 shadow-inner overflow-x-auto border border-surface-200/20">
            <button 
              onClick={() => setViewMode("monthly")}
              className={`px-4 md:px-6 py-2.5 text-[9px] md:text-[10px] font-black rounded-xl transition-all uppercase tracking-widest whitespace-nowrap flex items-center gap-2 ${viewMode === "monthly" ? 'bg-white shadow-xl text-primary-600 scale-[1.02]' : 'text-surface-400 hover:text-surface-600'}`}
            >
              <BarChart3 className="w-4 h-4" /> Mensual
            </button>
            <button 
              onClick={() => setViewMode("daily")}
              className={`px-4 md:px-6 py-2.5 text-[9px] md:text-[10px] font-black rounded-xl transition-all uppercase tracking-widest whitespace-nowrap flex items-center gap-2 ${viewMode === "daily" ? 'bg-white shadow-xl text-primary-600 scale-[1.02]' : 'text-surface-400 hover:text-surface-600'}`}
            >
              <ListTree className="w-4 h-4" /> Diario
            </button>
          </div>
        </div>

        {/* Content: Chart (Monthly) or Table (Daily) */}
        {viewMode === "monthly" ? (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-black text-surface-900 uppercase tracking-tight mb-6">
              Flujo de Caja - {selectedMonth}
            </h3>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorIngresos"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="colorEgresos"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Ingresos"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIngresos)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Egresos"
                      stroke="#EF4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEgresos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-surface-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-black uppercase tracking-widest">No hay datos para mostrar en este mes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px] md:min-w-0">
              <thead>
                <tr className="bg-surface-50/50 text-[10px] font-black text-surface-400 uppercase tracking-[0.25em] border-b border-surface-100">
                  <th className="px-6 md:px-8 py-5">Hora</th>
                  <th className="px-6 md:px-8 py-5">Concepto / Referencia</th>
                  <th className="px-6 md:px-8 py-5 hidden md:table-cell">Categoria</th>
                  <th className="px-6 md:px-8 py-5 hidden sm:table-cell">Metodo</th>
                  <th className="px-6 md:px-8 py-5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filteredData.map((payment, idx) => (
                  <tr 
                    key={payment.id} 
                    style={{ animationDelay: `${idx * 40}ms` }} 
                    className="hover:bg-surface-50/50 transition-colors group animate-in fade-in slide-in-from-left-4"
                  >
                    <td className="px-6 md:px-8 py-6">
                      <div className="text-xs font-black text-surface-900 uppercase tracking-tighter">
                        {new Date(payment.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-6">
                      <div className="text-xs md:text-sm font-black text-surface-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                        {payment.description || "Sin descripcion"}
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-6 hidden md:table-cell">
                      <span className="text-[9px] md:text-[10px] text-surface-500 font-black uppercase tracking-widest bg-surface-100/50 px-2 md:px-2.5 py-1 rounded-lg border border-surface-200/30">
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-6 hidden sm:table-cell">
                      <span className="text-[10px] font-black uppercase bg-white border border-surface-100 px-3 py-1.5 rounded-xl text-surface-500 shadow-sm">
                        {payment.method}
                      </span>
                    </td>
                    <td className={`px-6 md:px-8 py-6 text-right whitespace-nowrap ${
                      payment.transactionType === "egreso" ? "text-rose-600" : "text-emerald-600"
                    }`}>
                      <span className="text-xl md:text-2xl font-black tracking-tighter">
                        {payment.transactionType === "egreso" ? "-" : "+"}${payment.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="w-24 h-24 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-surface-100">
                        <BarChart3 className="w-10 h-10 text-surface-200 opacity-50" />
                      </div>
                      <h4 className="text-lg font-black text-surface-900 tracking-tight">Sin correspondencias</h4>
                      <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mt-2">No se registraron movimientos en esta fecha</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsFeature;