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
        title="Base de Clientes"
        subtitle="Gestión Integral de Contactos y Expedientes de Servicio"
      >
        <button 
          onClick={openNewClientModal}
          className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-200/50 flex items-center gap-2 hover:bg-primary-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </PageHeader>

      <DataCard padding="none">
        <div className="p-4 md:p-6 border-b border-surface-50 bg-surface-50/30">
          <SearchInput 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre o cédula..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50 text-[10px] font-black text-surface-400 uppercase tracking-[0.25em] border-b border-surface-100">
                <th className="px-6 md:px-8 py-4">Cliente</th>
                <th className="px-6 md:px-8 py-4 hidden sm:table-cell">Identidad</th>
                <th className="px-6 md:px-8 py-4 hidden md:table-cell">Contacto</th>
                <th className="px-6 md:px-8 py-4 hidden lg:table-cell">Email</th>
                <th className="px-6 md:px-8 py-4 hidden xl:table-cell">Dirección</th>
                <th className="px-6 md:px-8 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-surface-50/70 transition-colors">
                  <td className="px-6 md:px-8 py-4">
                    <div className="font-black text-sm text-surface-900">{client.fullName}</div>
                    <div className="sm:hidden mt-1 flex gap-2 text-xs text-surface-400">
                      <span>{client.documentId}</span>
                      <span>{client.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-4 hidden sm:table-cell">
                    <Badge variant="default">{client.documentId || 'S/N'}</Badge>
                  </td>
                  <td className="px-6 md:px-8 py-4 hidden md:table-cell">
                    <Badge variant="info">{client.phone || 'S/N'}</Badge>
                  </td>
                  <td className="px-6 md:px-8 py-4 hidden lg:table-cell">
                    <span className="text-sm text-surface-600">{client.email || 'S/N'}</span>
                  </td>
                  <td className="px-6 md:px-8 py-4 hidden xl:table-cell">
                    <span className="text-sm text-surface-600">{client.address || 'S/N'}</span>
                  </td>
                  <td className="px-6 md:px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)} 
                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-xl transition-all"
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
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 md:p-8 shadow-2xl animate-zoom-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl md:text-2xl font-black text-surface-900 mb-6">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  type="text"
                  required 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} 
                  className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-bold uppercase focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-surface-400 uppercase tracking-widest ml-1">Cédula / RUC</label>
                  <input 
                    type="text"
                    required 
                    value={formData.documentId} 
                    onChange={e => setFormData({...formData, documentId: e.target.value})} 
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-surface-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="text"
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest ml-1">Dirección</label>
                <textarea 
                  className="w-full p-5 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-medium min-h-[80px]"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saveStatus !== 'idle'}
                  className="flex-1 px-4 py-3 rounded-2xl font-bold bg-surface-100 text-surface-600 hover:bg-surface-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saveStatus !== 'idle'}
                  className="flex-[2] bg-primary-600 text-white font-black py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
                    'Guardar Cliente'
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
