import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Mail, MapPin, Loader2, CheckCircle2, Phone, CreditCard } from 'lucide-react';
import { ClientService } from '../services/ClientService';
import type { Client } from '../services/ClientService';

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
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

  const fetchClients = async () => {
    try {
      const data = await ClientService.getAllClients();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchClients();
    };
    loadData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredClients = clients.filter(client => 
    client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.documentId.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await ClientService.saveClient(editingClient ? { ...formData, id: editingClient.id } : formData);
      setSaveStatus('success');
      
      // Pequeno delay para mostrar el check antes de cerrar
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
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await ClientService.deleteClient(id);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 flex items-center gap-2">
            Lista de Clientes
          </h2>
          <p className="text-surface-500 mt-1">Gestiona la información de contacto y documentos de tus clientes.</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setFormData({ fullName: '', documentId: '', phone: '', email: '', address: '' }); setIsModalOpen(true); }} 
          className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary-100 flex items-center justify-center gap-2 hover:bg-primary-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o cédula..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50 text-[11px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100">
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Documento / Cédula</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Dirección</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-surface-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors">{client.fullName}</div>
                  </td>
                  <td className="px-6 py-4 text-surface-700 font-mono">
                    <div className="flex items-center gap-1.5 text-xs bg-surface-100/50 px-2 py-0.5 rounded-md w-fit">
                      <CreditCard className="w-3.5 h-3.5 text-surface-400" /> 
                      {client.documentId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-surface-400" /> 
                      {client.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-600 text-sm">
                    <div className="flex items-center gap-1.5 underline decoration-surface-200 underline-offset-4">
                      <Mail className="w-3.5 h-3.5 text-surface-400" /> 
                      {client.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-500 text-sm">
                    <div className="flex items-start gap-1.5 max-w-xs transition-all italic">
                      <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0 mt-0.5" />
                      {client.address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                        title="Edit Client"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)} 
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-100">
                      <Search className="w-8 h-8 text-surface-200" />
                    </div>
                    <p className="text-surface-400 font-bold text-sm">No se encontraron clientes que coincidan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 text-surface-900">{editingClient ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  type="text"
                  required 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} 
                  className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-bold uppercase focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Cédula / RUC</label>
                  <input 
                    type="text"
                    required 
                    value={formData.documentId} 
                    onChange={e => setFormData({...formData, documentId: e.target.value})} 
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="text"
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-5 py-3.5 font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">Dirección</label>
                <textarea 
                  className="w-full p-5 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-medium italic min-h-[100px]"
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                  placeholder="Ciudad, Calle Principal y Secundaria"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saveStatus !== 'idle'}
                  className="flex-1 px-4 py-3.5 rounded-2xl font-bold bg-surface-100 text-surface-600 hover:bg-surface-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saveStatus !== 'idle'}
                  className={`flex-[2] text-white font-black py-3.5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${saveStatus === 'success' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-primary-600 shadow-primary-100'}`}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      ¡Guardado!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Guardar Cliente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-surface-900 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 font-bold border border-surface-700 backdrop-blur-md">
            <div className="bg-emerald-500 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm">Cliente {editingClient ? 'Actualizado' : 'Registrado'}</h4>
              <p className="text-[10px] text-surface-400 uppercase tracking-tighter">Base de datos sincronizada</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
