import React, { useState, useEffect } from 'react';
import { Plus, Edit, PackageX, Loader2, CheckCircle2, Boxes, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { RepuestoService, type Repuesto } from '../../services/RepuestoService';
import { PageHeader, SearchInput, DataCard, EmptyState, Badge } from '../../components/design-system';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/molecules/Modal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { useToast } from '../../store/ToastContext';

const EMPTY_FORM = { nombre: '', sku: '', costo: '', precioVenta: '', stock: '', stockMinimo: '' };

export const InventoryFeature: React.FC = () => {
  const { showToast } = useToast();
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState<Repuesto | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [adjustingRepuesto, setAdjustingRepuesto] = useState<Repuesto | null>(null);

  // Sin setLoading(true) acá a propósito: el estado inicial ya es `true`
  // para el mount, y un refetch silencioso (después de guardar/dar de
  // baja) no necesita tapar la tabla con el spinner de nuevo.
  const fetchRepuestos = () => {
    RepuestoService.getAll()
      .then(setRepuestos)
      .catch(err => {
        console.error('Error loading repuestos:', err);
        showToast('No se pudo cargar el inventario', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRepuestos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = repuestos.filter(r =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNew = () => {
    setEditingRepuesto(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (r: Repuesto) => {
    setEditingRepuesto(r);
    setFormData({
      nombre: r.nombre,
      sku: r.sku || '',
      costo: String(r.costo),
      precioVenta: String(r.precioVenta),
      stock: String(r.stock),
      stockMinimo: String(r.stockMinimo),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const payload = {
        nombre: formData.nombre,
        sku: formData.sku,
        costo: Number(formData.costo) || 0,
        precioVenta: Number(formData.precioVenta) || 0,
        stockMinimo: Number(formData.stockMinimo) || 0,
      };
      if (editingRepuesto) {
        await RepuestoService.update(editingRepuesto.id, payload);
      } else {
        await RepuestoService.create({ ...payload, stock: Number(formData.stock) || 0 });
      }
      setSaveStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveStatus('idle');
        fetchRepuestos();
      }, 800);
    } catch (error) {
      console.error('Error saving repuesto:', error);
      setSaveStatus('idle');
      showToast('No se pudo guardar el repuesto', 'error');
    }
  };

  const handleDeactivate = async (r: Repuesto) => {
    if (!confirm(`¿Dar de baja "${r.nombre}"? Deja de aparecer en el catálogo, pero conserva su historial.`)) return;
    try {
      await RepuestoService.deactivate(r.id);
      fetchRepuestos();
      showToast('Repuesto dado de baja', 'success');
    } catch (error) {
      console.error('Error deactivating repuesto:', error);
      showToast('No se pudo dar de baja el repuesto', 'error');
    }
  };

  const inputClass = 'w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        subtitle={`${repuestos.length} repuesto${repuestos.length === 1 ? '' : 's'} en catálogo`}
      >
        <button
          onClick={openNew}
          className="bg-surface-900 text-white px-5 h-11 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-800 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo repuesto
        </button>
      </PageHeader>

      <DataCard padding="none" className="animate-fade-in-up">
        <div className="p-4 border-b border-surface-200 dark:border-gray-800">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por nombre o SKU..." />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-surface-500 dark:text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200 dark:bg-gray-900/60 dark:text-gray-400 dark:border-gray-800">
                  <th className="px-4 md:px-6 py-3">Repuesto</th>
                  <th className="px-4 md:px-6 py-3 hidden sm:table-cell">SKU</th>
                  <th className="px-4 md:px-6 py-3 hidden md:table-cell text-right">Costo</th>
                  <th className="px-4 md:px-6 py-3 text-right">Precio</th>
                  <th className="px-4 md:px-6 py-3 text-right">Stock</th>
                  <th className="px-4 md:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                {filtered.map(r => {
                  const stockBajo = r.stock <= r.stockMinimo;
                  return (
                    <tr key={r.id} className="hover:bg-surface-50 transition-colors duration-150 dark:hover:bg-gray-800/60">
                      <td className="px-4 md:px-6 py-3.5">
                        <div className="font-medium text-sm text-surface-900 dark:text-gray-100">{r.nombre}</div>
                        <div className="sm:hidden mt-1 text-xs text-surface-500 dark:text-gray-400">{r.sku || 'Sin SKU'}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-surface-600 dark:text-gray-400">{r.sku || 'S/N'}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 hidden md:table-cell text-right text-sm text-surface-600 dark:text-gray-400">
                        ${r.costo.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-right text-sm font-medium text-surface-900 dark:text-gray-100">
                        ${r.precioVenta.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-right">
                        <Badge variant={stockBajo ? 'warning' : 'default'}>
                          {stockBajo && <AlertTriangle className="w-3 h-3" />}
                          {r.stock}
                        </Badge>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setAdjustingRepuesto(r)}
                            className="p-2 text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors duration-150 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                            title="Ajustar stock"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(r)}
                            className="p-2 text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors duration-150 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(r)}
                            className="p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-150 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                            title="Dar de baja"
                          >
                            <PackageX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={<Boxes className="w-5 h-5" />}
                  title="Sin repuestos"
                  description={searchTerm ? 'Probá con otro nombre o SKU' : 'Cargá tu primer repuesto para empezar a llevar stock'}
                />
              </div>
            )}
          </div>
        )}
      </DataCard>

      {/* Alta / edición */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader
          title={editingRepuesto ? 'Editar repuesto' : 'Nuevo repuesto'}
          icon={<Boxes className="w-5 h-5" />}
          onClose={() => setIsModalOpen(false)}
          closeDisabled={saveStatus !== 'idle'}
        />
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Nombre</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                className={inputClass}
                placeholder="Pantalla iPhone 12"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">SKU (opcional)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Costo</label>
                <input
                  type="number" min={0} step="0.01" required
                  value={formData.costo}
                  onChange={e => setFormData({ ...formData, costo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Precio de venta</label>
                <input
                  type="number" min={0} step="0.01" required
                  value={formData.precioVenta}
                  onChange={e => setFormData({ ...formData, precioVenta: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">
                  Stock inicial
                </label>
                <input
                  type="number" min={0} required
                  disabled={!!editingRepuesto}
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {editingRepuesto && (
                  <p className="text-xs text-surface-500 mt-1 dark:text-gray-400">Usá "Ajustar stock" para cambiarlo</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5 dark:text-gray-400">Stock mínimo</label>
                <input
                  type="number" min={0} required
                  value={formData.stockMinimo}
                  onChange={e => setFormData({ ...formData, stockMinimo: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={saveStatus !== 'idle'}
              className="flex-1 h-11 rounded-lg text-sm font-medium border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 transition-colors duration-150 disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveStatus !== 'idle'}
              className="flex-[2] bg-surface-900 text-white text-sm font-medium h-11 rounded-lg hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : saveStatus === 'success' ? (
                <><CheckCircle2 className="w-4 h-4" /> Guardado</>
              ) : (
                'Guardar repuesto'
              )}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {adjustingRepuesto && (
        <AdjustStockModal
          repuesto={adjustingRepuesto}
          onClose={() => setAdjustingRepuesto(null)}
          onAdjusted={fetchRepuestos}
        />
      )}
    </div>
  );
};
