import React, { useState, useEffect } from 'react';
import { SettingsService } from '../services/SettingsService';
import type { BusinessSettings } from '../types';
import { SettingsContext } from './SettingsContextType';

const DEFAULT_SETTINGS: BusinessSettings = {
  companyName: '',
  logo: '',
  whatsappTemplate: 'Hola {{customer}}, te informamos que tu {{device}} ({{model}}) se encuentra en estado: {{status}}. Total: ${{total}}. Saldo pendiente: ${{saldo}}.',
  printerType: '80mm',
  phone: '',
  address: '',
  ruc: ''
};

// SettingsProvider component
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const dbSettings = await SettingsService.getSettings();
      if (dbSettings) {
        setSettings((prev: BusinessSettings) => ({ ...prev, ...dbSettings }));
      }
    } catch (error) {
      console.error('Error fetching settings from DB:', error);
      // Fallback to localStorage if available
      const savedSettings = localStorage.getItem('business_settings');
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } finally {
      setIsSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await SettingsService.updateSettings(updated);
      localStorage.setItem('business_settings', JSON.stringify(updated));
    } catch (err: unknown) {
      console.error('Error updating settings in DB:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert('Error guardando en base de datos: ' + msg);
      localStorage.setItem('business_settings', JSON.stringify(updated));
    }
  };


  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isSettingsLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};
