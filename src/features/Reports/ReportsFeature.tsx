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
import ExcelJS from "exceljs";
import { StatCard } from "../../components/molecules/StatCard";
import { PageHeader } from "../../components/design-system";

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

  const exportToExcel = async () => {
    setExportStatus("exporting");

    const formattedData = filteredData.map((p) => ({
      Fecha: new Date(p.date).toLocaleString(),
      Concepto: p.description || "Sin descripcion",
      Tipo: p.transactionType.toUpperCase(),
      Categoria: p.type,
      "Metodo de Pago": p.method,
      Valor: p.transactionType === "egreso" ? -p.amount : p.amount,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte");

    worksheet.columns = [
      { header: "Fecha", key: "Fecha" },
      { header: "Concepto", key: "Concepto" },
      { header: "Tipo", key: "Tipo" },
      { header: "Categoria", key: "Categoria" },
      { header: "Metodo de Pago", key: "Metodo de Pago" },
      { header: "Valor", key: "Valor" },
    ];

    formattedData.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      viewMode === "monthly"
        ? `Reporte_${selectedMonth}.xlsx`
        : `Reporte_${selectedDate}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    setExportStatus("success");
    setTimeout(() => setExportStatus("idle"), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Reportes"
        subtitle="Analizá los ingresos y egresos de tu negocio"
      >
        <button
          onClick={exportToExcel}
          disabled={exportStatus !== "idle"}
          className={`px-4 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
            exportStatus === "success"
              ? "bg-success-50 text-success-700 border border-success-100"
              : "bg-success-600 text-white hover:bg-success-700"
          }`}
        >
          {exportStatus === "exporting" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportStatus === "success" ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Completado
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Exportar Excel
            </>
          )}
        </button>
      </PageHeader>

      {/* Success Toast */}
      {exportStatus === "success" && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] animate-fade-in-up">
          <div className="bg-surface-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-full shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Reporte generado</p>
              <p className="text-xs text-surface-300 mt-0.5">El archivo se descargó correctamente</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total ingresos" amount={totals.ingresosTotal} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" delay="0ms" />
        <StatCard title="Total egresos" amount={totals.egresosTotal} icon={TrendingDown} color="text-rose-600" bgColor="bg-rose-50" delay="60ms" />
        <StatCard title="Balance neto" amount={totals.balance} icon={Wallet} color={totals.balance >= 0 ? "text-blue-600" : "text-rose-600"} bgColor={totals.balance >= 0 ? "bg-blue-50" : "bg-rose-50"} delay="120ms" />
        <StatCard title="Transacciones" amount={filteredData.length} icon={ArrowUpRight} color="text-primary-600" bgColor="bg-primary-50" delay="180ms" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-surface-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            <div className="flex items-center relative w-full sm:w-auto min-w-[190px] bg-white border border-surface-300 rounded-lg px-3 py-2 hover:border-surface-400 transition-colors duration-150">
              <CalendarDays className="w-4 h-4 text-surface-500 absolute left-3 z-10 pointer-events-none" />
              {viewMode === "monthly" ? (
                <div className="relative flex items-center w-full">
                  <span className="pl-7 pr-2 text-sm font-medium text-surface-700 w-full text-center capitalize">
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
                <div className="relative flex items-center w-full">
                  <span className="pl-7 pr-2 text-sm font-medium text-surface-700 w-full text-center">
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

          <div className="flex bg-surface-100 p-1 rounded-lg shrink-0 overflow-x-auto">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 ${viewMode === "monthly" ? 'bg-white shadow-xs text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Mensual
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 ${viewMode === "daily" ? 'bg-white shadow-xs text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
            >
              <ListTree className="w-3.5 h-3.5" /> Diario
            </button>
          </div>
        </div>

        {/* Content: Chart (Monthly) or Table (Daily) */}
        {viewMode === "monthly" ? (
          <div className="p-5 md:p-6">
            <h3 className="text-base font-semibold text-surface-900 mb-6">
              Flujo de caja — {selectedMonth}
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
                    <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-surface-500">No hay datos para mostrar en este mes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200">
                  <th className="px-4 md:px-6 py-3">Hora</th>
                  <th className="px-4 md:px-6 py-3">Concepto</th>
                  <th className="px-4 md:px-6 py-3 hidden md:table-cell">Categoría</th>
                  <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Método</th>
                  <th className="px-4 md:px-6 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredData.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-surface-50 transition-colors duration-150"
                  >
                    <td className="px-4 md:px-6 py-3.5">
                      <div className="text-sm text-surface-600">
                        {new Date(payment.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3.5">
                      <div className="text-sm font-medium text-surface-900 truncate max-w-[160px] md:max-w-none">
                        {payment.description || "Sin descripción"}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3.5 hidden md:table-cell">
                      <span className="text-xs font-medium text-surface-600 capitalize bg-surface-100 px-2 py-0.5 rounded-md">
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                      <span className="text-xs font-medium capitalize bg-surface-100 px-2 py-0.5 rounded-md text-surface-600">
                        {payment.method}
                      </span>
                    </td>
                    <td className={`px-4 md:px-6 py-3.5 text-right whitespace-nowrap ${
                      payment.transactionType === "egreso" ? "text-rose-600" : "text-emerald-600"
                    }`}>
                      <span className="text-base font-semibold tracking-tight">
                        {payment.transactionType === "egreso" ? "-" : "+"}${payment.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-5 h-5 text-surface-400" />
                      </div>
                      <h4 className="text-base font-semibold text-surface-900">Sin movimientos</h4>
                      <p className="text-sm text-surface-500 mt-1">No se registraron movimientos en esta fecha.</p>
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