import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Mail, MapPin, Loader2, CheckCircle2, Phone, CreditCard } from 'lucide-react';
import { ClientService } from '../services/ClientService';
import type { Client } from '../services/ClientService';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { Input } from '../components/atoms/Input';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 flex items-center gap-2">
            Lista de Clientes
          </h2>
          <p className="text-gray-500">Gestiona la informacion de contacto y documentos de tus clientes.</p>
        </div>
        <Button 
          onClick={() => { setEditingClient(null); setFormData({ fullName: '', documentId: '', phone: '', email: '', address: '' }); setIsModalOpen(true); }} 
          className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-primary-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o cedula..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Cedula</th>
                <th className="px-6 py-4">Telefono</th>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Direccion</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{client.fullName}</td>
                  <td className="px-6 py-4 text-gray-700 font-mono">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" /> 
                      {client.documentId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" /> 
                      {client.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" /> 
                      {client.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    <div className="flex items-start gap-1 max-w-xs">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      {client.address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Client"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6">{editingClient ? 'Edit Client' : 'Agregar Cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <Input 
                  required 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value.toUpperCase()})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cedula / RUC</label>
                <Input 
                  required 
                  value={formData.documentId} 
                  onChange={e => setFormData({...formData, documentId: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <Input 
                  required 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electronico</label>
                <Input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                  placeholder="Ej. Av. Siempre Viva 123"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saveStatus !== 'idle'}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={saveStatus !== 'idle'}
                  className={`${saveStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : ''} transition-all duration-300 min-w-[140px] flex items-center justify-center gap-2`}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      ¡Guardado!
                    </>
                  ) : (
                    'Guardar Cliente'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="bg-white border border-emerald-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px]">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Cliente {editingClient ? 'Actualizado' : 'Registrado'}</h4>
              <p className="text-sm text-gray-500">La informacion se ha guardado correctamente.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
