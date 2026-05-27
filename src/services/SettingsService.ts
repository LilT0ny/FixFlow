// src/services/SettingsService.ts
import { supabase } from '../lib/supabase';
import { AuthService } from './SaaSAuthService';
import type { BusinessSettings } from '../types';

/** Helper: obtiene el tenant_id de la sesión actual */
function getCurrentTenantId(): string | null {
  return AuthService.getCurrentTenantId();
}

export const SettingsService = {
  async getSettings(): Promise<BusinessSettings | null> {
    const tenantId = getCurrentTenantId();

    // Sin tenant activo no tiene sentido cargar ajustes (usuario no logueado o master admin)
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('ajustes')
      .select('*')
      .eq('tenant_id', tenantId)
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
    const tenantId = getCurrentTenantId();

    if (!tenantId) {
      throw new Error('No se puede actualizar ajustes sin tenant_id');
    }

    const payload = {
      tenant_id: tenantId,
      nombre_empresa: settings.companyName,
      ruc: settings.ruc,
      telefono: settings.phone,
      direccion: settings.address,
      logo: settings.logo,
      whatsapp_template: settings.whatsappTemplate,
      tipo_impresora: settings.printerType,
      updated_at: new Date().toISOString()
    };

    console.log("Upserting ajustes para tenant:", tenantId, payload);

    const { error } = await supabase
      .from('ajustes')
      .upsert(payload, { onConflict: 'tenant_id' });

    if (error) {
      console.error("Error en UPSERT de ajustes:", error);
      throw new Error(`Supabase Error [${error.code}]: ${error.message}`);
    }

    return { status: 'success' };
  }
};
