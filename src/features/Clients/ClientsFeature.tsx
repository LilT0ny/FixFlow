import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import type { Client } from '../../services/ClientService';
import { useClients } from './hooks/useClients';
import { PageHeader, SearchInput, DataCard, EmptyState, Badge } from '../../components/design-system';

export const ClientsFeature: React.FC = () => {
  const { clients, fetchClients, deleteClient, saveClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    fullName: '',
    documentId: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.documentId.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await saveClient(editingClient ? { ...formData, id: editingClient.id } : formData);
      setSaveStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFormData({ fullName: '', documentId: '', phone: '', email: '', address: '' });
        setSaveStatus('idle');
        fetchClients();
      }, 1000);
    } catch (error) {
      console.error('Error saving client:', error);
      setSaveStatus('idle');
      alert('Error al guardar el cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName,
      documentId: client.documentId,
      phone: client.phone,
      email: client.email || '',
      address: client.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteClient(id);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormData({ fullName: '', documentId: '', phone: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Gestión de contactos y expedientes de servicio"
      >
        <button
          onClick={openNewClientModal}
          className="bg-surface-900 text-white px-5 h-11 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-800 transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </PageHeader>

      <DataCard padding="none" className="animate-fade-in-up">
        <div className="p-4 border-b border-surface-200">
          <SearchInput 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre o cédula..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="bg-surface-50 text-xs font-medium text-surface-500 border-b border-surface-200">
                <th className="px-4 md:px-6 py-3">Cliente</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Identidad</th>
                <th className="px-4 md:px-6 py-3 hidden md:table-cell">Contacto</th>
                <th className="px-4 md:px-6 py-3 hidden lg:table-cell">Email</th>
                <th className="px-4 md:px-6 py-3 hidden xl:table-cell">Dirección</th>
                <th className="px-4 md:px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-surface-50 transition-colors duration-150">
                  <td className="px-4 md:px-6 py-3.5">
                    <div className="font-medium text-sm text-surface-900">{client.fullName}</div>
                    <div className="sm:hidden mt-1 flex gap-2 text-xs text-surface-500">
                      <span>{client.documentId}</span>
                      <span>{client.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden sm:table-cell">
                    <Badge variant="default">{client.documentId || 'S/N'}</Badge>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden md:table-cell">
                    <Badge variant="info">{client.phone || 'S/N'}</Badge>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-surface-600">{client.email || 'S/N'}</span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 hidden xl:table-cell">
                    <span className="text-sm text-surface-600">{client.address || 'S/N'}</span>
                  </td>
                  <td className="px-4 md:px-6 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-surface-400 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors duration-150"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-150"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="p-8">
              <EmptyState 
                title="No se encontraron clientes"
                description="Prueba con otros parámetros de búsqueda"
              />
            </div>
          )}
        </div>
      </DataCard>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-900/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-surface-200 w-full max-w-md p-6 shadow-lg animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">
              {editingClient ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})}
                  className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">Cédula / RUC</label>
                  <input
                    type="text"
                    required
                    value={formData.documentId}
                    onChange={e => setFormData({...formData, documentId: e.target.value})}
                    className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">Dirección</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-150 outline-none min-h-[80px]"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saveStatus !== 'idle'}
                  className="flex-1 px-4 h-11 rounded-lg text-sm font-medium border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 transition-colors duration-150 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveStatus !== 'idle'}
                  className="flex-[2] bg-surface-900 text-white text-sm font-medium h-11 rounded-lg hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Guardado
                    </>
                  ) : (
                    'Guardar cliente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
