import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/molecules/Modal';
import { RepuestoService, type Repuesto, type MovimientoInventario } from '../../../services/RepuestoService';
import { useToast } from '../../../store/ToastContext';

interface AdjustStockModalProps {
  repuesto: Repuesto;
  onClose: () => void;
  onAdjusted: () => void;
}

const TIPO_LABEL: Record<MovimientoInventario['tipo'], string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ repuesto, onClose, onAdjusted }) => {
  const { showToast } = useToast();
  const [signo, setSigno] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(true);

  useEffect(() => {
    RepuestoService.getMovements(repuesto.id)
      .then(setMovimientos)
      .catch(err => console.error('Error loading movimientos:', err))
      .finally(() => setLoadingMovs(false));
  }, [repuesto.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantidadNum = Number(cantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      showToast('Ingresá una cantidad mayor a cero', 'error');
      return;
    }
    if (!motivo.trim()) {
      showToast('Ingresá un motivo para el ajuste', 'error');
      return;
    }

    setSaving(true);
    try {
      await RepuestoService.adjustStock(repuesto.id, signo === 'entrada' ? cantidadNum : -cantidadNum, motivo.trim());
      showToast('Stock actualizado', 'success');
      onAdjusted();
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo ajustar el stock', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100';

  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalHeader
        title="Ajustar stock"
        subtitle={repuesto.nombre}
        icon={<SlidersHorizontal className="w-5 h-5" />}
        onClose={onClose}
        closeDisabled={saving}
      />
      <form onSubmit={handleSubmit} className="contents">
        <ModalBody className="space-y-5">
          <div className="p-3.5 rounded-lg bg-surface-50 border border-surface-200 dark:bg-gray-800/60 dark:border-gray-700 text-center">
            <p className="text-xs text-surface-500 dark:text-gray-400">Stock actual</p>
            <p className="text-2xl font-semibold text-surface-900 dark:text-gray-100">{repuesto.stock}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSigno('entrada')}
              className={`py-2.5 px-4 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 transition-colors duration-150 ${
                signo === 'entrada'
                  ? 'bg-success-600 text-white border-success-600'
                  : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" /> Entrada
            </button>
            <button
              type="button"
              onClick={() => setSigno('salida')}
              className={`py-2.5 px-4 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 transition-colors duration-150 ${
                signo === 'salida'
                  ? 'bg-danger-600 text-white border-danger-600'
                  : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" /> Salida
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Cantidad</label>
            <input
              type="number" min={1} required
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Motivo</label>
            <input
              type="text" required
              placeholder="Reposición de proveedor, corrección de conteo..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-surface-500 mb-2 dark:text-gray-400">Últimos movimientos</p>
            {loadingMovs ? (
              <p className="text-xs text-surface-400 dark:text-gray-500">Cargando...</p>
            ) : movimientos.length === 0 ? (
              <p className="text-xs text-surface-400 dark:text-gray-500">Sin movimientos todavía.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {movimientos.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b border-surface-100 dark:border-gray-800">
                    <div className="min-w-0">
                      <span className="font-medium text-surface-700 dark:text-gray-300">{TIPO_LABEL[m.tipo]}</span>
                      <span className="text-surface-500 dark:text-gray-500"> · {m.motivo}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={m.tipo === 'salida' ? 'text-danger-600 dark:text-red-400' : 'text-success-600 dark:text-emerald-400'}>
                        {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                      </span>
                      <span className="text-surface-400 dark:text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-11 rounded-lg text-sm font-medium border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 transition-colors duration-150 disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] bg-surface-900 text-white text-sm font-medium h-11 rounded-lg hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Aplicando...</> : 'Aplicar ajuste'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
