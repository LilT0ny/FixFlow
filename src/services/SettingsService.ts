// src/services/SettingsService.ts
import { supabase } from '../lib/supabase';
import type { BusinessSettings } from '../types';

export const SettingsService = {
  async getSettings(): Promise<BusinessSettings | null> {
    const { data, error } = await supabase
      .from('ajustes')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error("Error cargando ajustes:", error);
      throw error;
    }

    if (data) {
      return {
        companyName: data.nombre_empresa,
        ruc: data.ruc,
        phone: data.telefono,
        address: data.direccion,
        logo: data.logo,
        whatsappTemplate: data.whatsapp_template,
        printerType: data.tipo_impresora as BusinessSettings['printerType']
      };
    }
    return null;
  },

  async updateSettings(settings: BusinessSettings): Promise<{ status: string }> {
    const payload = {
      id: 1,
      nombre_empresa: settings.companyName,
      ruc: settings.ruc,
      telefono: settings.phone,
      direccion: settings.address,
      logo: settings.logo,
      whatsapp_template: settings.whatsappTemplate,
      tipo_impresora: settings.printerType,
      updated_at: new Date().toISOString()
    };

    console.log("Upserting ajustes id=1 con payload:", payload);

    const { error } = await supabase
      .from('ajustes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error("Error en UPSERT de ajustes:", error);
      throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    }

    return { status: 'success' };
  }
};




