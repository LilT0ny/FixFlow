import { createContext } from 'react';
import type { BusinessSettings } from '../types';

export interface SettingsContextType {
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  isSettingsLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
SettingsContext.displayName = 'SettingsContext';
