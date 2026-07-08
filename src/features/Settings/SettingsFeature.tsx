import React, { useState } from 'react';
import { Building2, Printer, Users } from 'lucide-react';
import { PageHeader } from '../../components/design-system';
import { CompanyTab } from './components/CompanyTab';
import { PrintingTab } from './components/PrintingTab';
import { UsersTab } from './components/UsersTab';

type SettingsTab = 'empresa' | 'impresion' | 'usuarios';

const TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'impresion', label: 'Impresión y mensajes', icon: Printer },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
];

export const SettingsFeature: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('empresa');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Parámetros del negocio y preferencias de la aplicación"
      />

      <div className="flex gap-1 bg-surface-100 p-1 rounded-lg w-fit overflow-x-auto max-w-full">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white shadow-xs text-surface-900' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'empresa' && <CompanyTab />}
      {activeTab === 'impresion' && <PrintingTab />}
      {activeTab === 'usuarios' && <UsersTab />}
    </div>
  );
};
