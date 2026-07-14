import React, { useState } from 'react';
import { Database, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppContext } from '../../../store/AppContext';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../store/ToastContext';
import { ClientService } from '../../../services/ClientService';
import { NotaVentaService } from '../../../services/NotaVentaService';
import { exportWorkbook } from '../../../utils/excelExport';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'taller';

export const ExportTab: React.FC = () => {
  const { orders, payments } = useAppContext();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'idle' | 'exporting' | 'success'>('idle');

  const handleExport = async () => {
    setStatus('exporting');
    try {
      const [clients, salesNotes] = await Promise.all([
        ClientService.getAllClients(),
        NotaVentaService.getAllSalesNotes(),
      ]);

      const filename = `FixFlow_export_${slugify(settings.companyName || '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      await exportWorkbook(
        [
          {
            name: 'Clientes',
            columns: [
              { header: 'Nombre completo', key: 'nombre' },
              { header: 'Cédula/RUC', key: 'cedula' },
              { header: 'Teléfono', key: 'telefono' },
              { header: 'Email', key: 'email' },
              { header: 'Dirección', key: 'direccion' },
            ],
            rows: clients.map(c => ({
              nombre: c.fullName,
              cedula: c.documentId,
              telefono: c.phone,
              email: c.email || '',
              direccion: c.address || '',
            })),
          },
          {
            name: 'Ordenes de reparacion',
            columns: [
              { header: 'N° de orden', key: 'numero' },
              { header: 'Cliente', key: 'cliente' },
              { header: 'Equipo', key: 'equipo' },
              { header: 'Estado', key: 'estado' },
              { header: 'Costo total', key: 'total' },
              { header: 'Abono', key: 'abono' },
              { header: 'Saldo', key: 'saldo' },
              { header: 'Fecha', key: 'fecha' },
            ],
            rows: orders.map(o => ({
              numero: o.orderNumber,
              cliente: o.customer.fullName,
              equipo: [o.device?.brand, o.device?.model].filter(Boolean).join(' '),
              estado: o.status,
              total: o.repair.repairTotalCost || 0,
              abono: o.repair.initialDeposit || 0,
              saldo: (o.repair.repairTotalCost || 0) - (o.repair.initialDeposit || 0),
              fecha: new Date(o.createdAt).toLocaleString(),
            })),
          },
          {
            name: 'Transacciones',
            columns: [
              { header: 'Fecha', key: 'fecha' },
              { header: 'Concepto', key: 'concepto' },
              { header: 'Monto', key: 'monto' },
              { header: 'Medio de pago', key: 'medio' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Clasificación', key: 'clasificacion' },
            ],
            rows: payments.map(p => ({
              fecha: new Date(p.date).toLocaleString(),
              concepto: p.description || 'Sin descripción',
              monto: p.transactionType === 'egreso' ? -p.amount : p.amount,
              medio: p.method,
              tipo: p.transactionType,
              clasificacion: p.type,
            })),
          },
          {
            name: 'Notas de venta',
            columns: [
              { header: 'N° de nota', key: 'numero' },
              { header: 'Cliente', key: 'cliente' },
              { header: 'Total', key: 'total' },
              { header: 'Fecha', key: 'fecha' },
            ],
            rows: salesNotes.map(n => ({
              numero: n.numero,
              cliente: n.cliente,
              total: n.total,
              fecha: new Date(n.fecha).toLocaleString(),
            })),
          },
        ],
        filename
      );

      setStatus('success');
      showToast('Datos exportados — el archivo se descargó correctamente', 'success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error exporting tenant data:', error);
      setStatus('idle');
      showToast(
        'No se pudo generar el export: ' + (error instanceof Error ? error.message : 'Error desconocido'),
        'error'
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4 sm:p-6 shadow-xs dark:bg-gray-900 dark:border-gray-800 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-surface-100 pb-4 dark:border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 shrink-0 dark:bg-gray-800 dark:text-gray-400">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-surface-900 dark:text-gray-100">Exportar todos mis datos</h2>
          <p className="text-xs text-surface-500 dark:text-gray-400">
            Clientes, órdenes de reparación, transacciones y notas de venta
          </p>
        </div>
      </div>

      <p className="text-sm text-surface-600 mt-4 leading-relaxed dark:text-gray-400">
        Generá un archivo Excel con todos los datos registrados en tu taller — clientes, órdenes de
        reparación, movimientos de caja y notas de venta — organizados en hojas separadas. Útil para
        respaldos propios o si necesitás migrar tu información a otro sistema.
      </p>

      <div className="mt-5 flex justify-end">
        <button
          onClick={handleExport}
          disabled={status !== 'idle'}
          className={`px-5 h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
            status === 'success' ? 'bg-success-600 text-white' : 'bg-surface-900 text-white hover:bg-surface-800'
          }`}
        >
          {status === 'exporting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Exportando...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> ¡Listo!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Exportar todos mis datos
            </>
          )}
        </button>
      </div>
    </div>
  );
};
