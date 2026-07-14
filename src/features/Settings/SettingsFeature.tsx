import React, { useState } from 'react';
import { Building2, Printer, Users, Download, History } from 'lucide-react';
import { PageHeader } from '../../components/design-system';
import { CompanyTab } from './components/CompanyTab';
import { PrintingTab } from './components/PrintingTab';
import { UsersTab } from './components/UsersTab';
import { ExportTab } from './components/ExportTab';
import { AuditLogTab } from './components/AuditLogTab';
import { useAppContext } from '../../store/AppContext';

type SettingsTab = 'empresa' | 'impresion' | 'usuarios' | 'exportar' | 'auditoria';

const BASE_TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'impresion', label: 'Impresión y mensajes', icon: Printer },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
];

export const SettingsFeature: React.FC = () => {
  const { authUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('empresa');

  // Exportar datos y ver la auditoría son acciones sensibles (PII completa
  // de clientes finales, o el rastro de qué hizo cada miembro del taller)
  // — solo el owner del taller puede verlas y usarlas.
  const isOwner = authUser?.role === 'owner';
  const TABS = isOwner
    ? [
        ...BASE_TABS,
        { id: 'exportar' as const, label: 'Exportar datos', icon: Download },
        { id: 'auditoria' as const, label: 'Auditoría', icon: History },
      ]
    : BASE_TABS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Parámetros del negocio y preferencias de la aplicación"
      />

      <div className="flex gap-1 bg-surface-100 p-1 rounded-lg w-fit overflow-x-auto max-w-full dark:bg-gray-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white shadow-xs text-surface-900 dark:bg-gray-900 dark:text-gray-100' : 'text-surface-500 hover:text-surface-700 dark:text-gray-400 dark:hover:text-gray-300'
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
      {activeTab === 'exportar' && isOwner && <ExportTab />}
      {activeTab === 'auditoria' && isOwner && <AuditLogTab />}
    </div>
  );
};
