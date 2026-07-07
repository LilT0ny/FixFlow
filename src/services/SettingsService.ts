// src/services/SettingsService.ts
import { supabase } from '../lib/supabase';
import type { BusinessSettings } from '../types';

/**
 * Los ajustes viven repartidos según su naturaleza:
 * - Marca del taller (nombre, RUC, teléfono, dirección) → tabla tenants (única fuente)
 * - Configuración operativa (logo, plantilla WhatsApp, impresora, términos) → tabla ajustes
 * RLS: el taller ve su fila; solo el owner escribe.
 */
export const SettingsService = {
  async getSettings(): Promise<(BusinessSettings & { termsConditions?: string }) | null> {
    const [tenantRes, ajustesRes] = await Promise.all([
      supabase.from('tenants').select('id, nombre_empresa, ruc, telefono, direccion').maybeSingle(),
      supabase.from('ajustes').select('*').maybeSingle(),
    ]);

    if (tenantRes.error) throw tenantRes.error;
    if (ajustesRes.error) throw ajustesRes.error;

    const tenant = tenantRes.data;
    if (!tenant) return null; // sin sesión de taller (master o no logueado)

    const ajustes = ajustesRes.data;
    return {
      companyName: tenant.nombre_empresa || '',
      ruc: tenant.ruc || '',
      phone: tenant.telefono || '',
      address: tenant.direccion || '',
      logo: ajustes?.logo_url || '',
      whatsappTemplate: ajustes?.whatsapp_template || '',
      printerType: (ajustes?.tipo_impresora || '80mm') as BusinessSettings['printerType'],
      termsConditions: ajustes?.terminos_condiciones || '',
    };
  },

  async updateSettings(settings: BusinessSettings & { termsConditions?: string }): Promise<{ status: string }> {
    const { data: tenant, error: tenantFetchErr } = await supabase
      .from('tenants')
      .select('id')
      .maybeSingle();

    if (tenantFetchErr) throw tenantFetchErr;
    if (!tenant) throw new Error('No se puede actualizar ajustes sin taller activo');

    const [tenantRes, ajustesRes] = await Promise.all([
      supabase.from('tenants').update({
        nombre_empresa: settings.companyName,
        ruc: settings.ruc,
        telefono: settings.phone,
        direccion: settings.address,
      }).eq('id', tenant.id),
      supabase.from('ajustes').upsert({
        tenant_id: tenant.id,
        logo_url: settings.logo,
        whatsapp_template: settings.whatsappTemplate,
        tipo_impresora: settings.printerType,
        terminos_condiciones: settings.termsConditions || '',
      }, { onConflict: 'tenant_id' }),
    ]);

    if (tenantRes.error) {
      throw new Error(`Supabase Error [${tenantRes.error.code}]: ${tenantRes.error.message}`);
    }
    if (ajustesRes.error) {
      throw new Error(`Supabase Error [${ajustesRes.error.code}]: ${ajustesRes.error.message}`);
    }

    return { status: 'success' };
  }
};
