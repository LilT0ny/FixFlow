import React, { useState, useEffect } from 'react';
import { SettingsService } from '../services/SettingsService';
import type { BusinessSettings } from '../types';
import { SettingsContext } from './SettingsContextType';
import { useAppContext } from './AppContext';

const DEFAULT_SETTINGS: BusinessSettings = {
  companyName: '',
  logo: '',
  whatsappTemplate: 'Hola {{customer}}, te informamos que tu {{device}} ({{model}}) se encuentra en estado: {{status}}. Total: ${{total}}. Saldo pendiente: ${{saldo}}.',
  printerType: '80mm',
  phone: '',
  address: '',
  ruc: '',
  termsConditions: ''
};

// SettingsProvider component
// Única fuente de verdad: la base (tenants + ajustes, filtrado por RLS).
// Se carga cuando hay sesión de taller — nada de localStorage (datos viejos
// y fuga visual entre talleres en una máquina compartida).
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setSettings(DEFAULT_SETTINGS);
      setIsSettingsLoading(false);
      return;
    }

    let cancelled = false;
    setIsSettingsLoading(true);
    SettingsService.getSettings()
      .then(dbSettings => {
        if (!cancelled && dbSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...dbSettings });
        }
      })
      .catch(error => {
        console.error('Error fetching settings from DB:', error);
      })
      .finally(() => {
        if (!cancelled) setIsSettingsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    const previous = settings;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await SettingsService.updateSettings(updated);
    } catch (err: unknown) {
      // Revertir el estado optimista: la base es la única verdad
      setSettings(previous);
      console.error('Error updating settings in DB:', err);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isSettingsLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};
