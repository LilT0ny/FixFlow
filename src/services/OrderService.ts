// src/services/OrderService.ts
import { supabase } from '../lib/supabase';
import { AuthService } from './SaaSAuthService';
import type { ServiceOrder, EvidencePhoto, OrderStatus, DeviceCheckInForm } from '../types';

/** Helper: obtiene el tenant_id de la sesión actual */
function getCurrentTenantId(): string | null {
  return AuthService.getCurrentTenantId();
}

/** Tipos de respuesta para mantener compatibilidad */
interface SaveOrderResponse {
  status: string;
  id: string;
  orderNumber: string;
  message?: string;
  order?: ServiceOrder;
}

interface StatusResponse {
  status: string;
  message?: string;
  order?: ServiceOrder;
}

/** Interface for order creation payload with optional flags */
export interface OrderCreationPayload extends DeviceCheckInForm {
  paymentMethod?: string;
  skipIncomeRecord?: boolean;
}

export const OrderService = {
  /**
   * Helper privado para obtener una orden completa (con joins) por su ID.
   */
  async _getOrderById(id: string): Promise<ServiceOrder | null> {
    const { data: order, error } = await supabase
      .from('ordenes_servicio')
      .select(`
        *,
        cliente:id_cliente (*),
        dispositivo:id_dispositivo (
          *,
          cliente:id_cliente (*)
        ),
        fotos:fotos_evidencia (*)
      `)
      .eq('id', id)
      .single();

    if (error || !order) return null;

    return {
      id: order.id.toString(),
      orderNumber: order.numero_orden,
      status: order.estado,
      createdAt: order.fecha_creacion,
      deleted: order.eliminado,
      customer: order.dispositivo?.cliente ? {
        fullName: order.dispositivo.cliente.nombre_completo,
        documentId: order.dispositivo.cliente.cedula,
        phone: order.dispositivo.cliente.telefono,
        address: order.dispositivo.cliente.direccion,
        email: order.dispositivo.cliente.email,
      } : {
        fullName: order.cliente?.nombre_completo || 'Cliente Desconocido',
        documentId: order.cliente?.cedula || '',
        phone: order.cliente?.telefono || '',
        address: order.cliente?.direccion || '',
        email: order.cliente?.email || '',
      },
      device: order.dispositivo ? {
        brand: order.dispositivo.marca,
        model: order.dispositivo.modelo,
        serialNumber: order.dispositivo.imei_sn,
        deviceType: order.dispositivo.tipo_dispositivo,
        physicalCondition: order.dispositivo.estado_fisico,
      } : undefined,
      repair: {
        reportedIssue: order.falla_reportada,
        initialDeposit: Number(order.abono_inicial),
        repairTotalCost: Number(order.costo_total_reparacion),
        evidencePhotos: order.fotos ? (order.fotos as { etapa: EvidencePhoto['stage']; url_foto: string }[]).map((f) => ({
          stage: f.etapa,
          url: f.url_foto
        })) : []
      }
    };
  },

  /**
   * Busca un cliente por su número de cédula/RUC (filtrado por tenant).
   */
  async checkClientByCedula(cedula: string): Promise<{ found: boolean; client?: ServiceOrder['customer'] }> {
    const tenantId = getCurrentTenantId();
    
    let query = supabase.from('clientes').select('*').eq('cedula', cedula);
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (data) {
      return {
        found: true,
        client: {
          fullName: data.nombre_completo,
          documentId: data.cedula,
          phone: data.telefono,
          address: data.direccion,
          email: data.email
        }
      };
    }
    return { found: false };
  },

  /**
   * Obtiene todas las órdenes y notas de venta activas del tenant actual.
   */
  async getOrders(): Promise<ServiceOrder[]> {
    const tenantId = getCurrentTenantId();

    let repQuery = supabase.from('ordenes_servicio').select(`
      *,
      cliente:id_cliente (*),
      dispositivo:id_dispositivo (*, cliente:id_cliente (*)),
      fotos:fotos_evidencia (*)
    `).eq('eliminado', 0).order('fecha_creacion', { ascending: false });

    let ntQuery = supabase.from('notas_venta').select(`
      *,
      cliente:id_cliente (*)
    `).eq('eliminado', 0).order('fecha_creacion', { ascending: false });

    if (tenantId) {
      repQuery = repQuery.eq('tenant_id', tenantId);
      ntQuery = ntQuery.eq('tenant_id', tenantId);
    }

    const [repRes, ntRes] = await Promise.all([repQuery, ntQuery]);

    if (repRes.error) throw repRes.error;
    if (ntRes.error) throw ntRes.error;

    // Mapeo de Reparaciones usando el helper interno
    const repairs = (repRes.data || []).map(order => this._mapOrder(order));
    
    // Mapeo de Notas de Venta simplificado
    const sales = (ntRes.data || []).map(nt => ({
      id: nt.id.toString(),
      orderNumber: nt.numero_nota,
      status: 'entregado' as OrderStatus,
      createdAt: nt.fecha_creacion,
      deleted: nt.eliminado === 1,
      customer: {
        fullName: nt.cliente?.nombre_completo || 'Cliente Desconocido',
        documentId: nt.cliente?.cedula || '',
        phone: nt.cliente?.telefono || '',
        address: nt.cliente?.direccion || '',
        email: nt.cliente?.email || '',
      },
      repair: {
        reportedIssue: nt.descripcion_general || 'VENTA DIRECTA',
        repairTotalCost: Number(nt.total),
        initialDeposit: Number(nt.total),
        evidencePhotos: []
      }
    }));

    return [...repairs, ...sales].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Registra una nueva orden (REP) o Nota de Venta (NT).
   */
  async saveOrder(orderData: Omit<ServiceOrder, 'id' | 'createdAt'>): Promise<SaveOrderResponse> {
    const tenantId = getCurrentTenantId();

    try {
      const isNT = orderData.orderNumber.startsWith('NT');

      // 1. Upsert del Cliente (con tenant_id)
      const clientPayload: Record<string, unknown> = {
        nombre_completo: orderData.customer.fullName,
        cedula: orderData.customer.documentId,
        telefono: orderData.customer.phone,
        direccion: orderData.customer.address,
        email: orderData.customer.email
      };
      if (tenantId) clientPayload.tenant_id = tenantId;

      const { data: client, error: clientErr } = await supabase
        .from('clientes')
        .upsert(clientPayload, { onConflict: 'cedula' })
        .select().single();

      if (clientErr) throw clientErr;

      let resultId = '';

      if (isNT) {
        const method = (orderData as OrderCreationPayload).paymentMethod || 'efectivo';
        const ntPayload: Record<string, unknown> = {
          numero_nota: orderData.orderNumber,
          id_cliente: client.id,
          total: Number(orderData.repair.repairTotalCost),
          descripcion_general: orderData.repair.reportedIssue,
          metodo_pago: method
        };
        if (tenantId) ntPayload.tenant_id = tenantId;

        const { data: nt, error: ntErr } = await supabase
          .from('notas_venta')
          .insert(ntPayload)
          .select().single();
        if (ntErr) throw ntErr;
        resultId = nt.id;
        
        if (!(orderData as OrderCreationPayload).skipIncomeRecord) {
          const ingPayload: Record<string, unknown> = {
            monto: Number(orderData.repair.repairTotalCost),
            metodo: method,
            tipo: 'repuestos',
            descripcion: `VENTA DIRECTA - NOTA #${orderData.orderNumber}`,
            id_cliente: client.id
          };
          if (tenantId) ingPayload.tenant_id = tenantId;
          await supabase.from('ingresos').insert(ingPayload);
        }

      } else {
        // FLUJO REP
        let deviceId = null;
        if (orderData.device) {
          const devPayload: Record<string, unknown> = {
            id_cliente: client.id,
            marca: orderData.device.brand,
            modelo: orderData.device.model,
            imei_sn: orderData.device.serialNumber,
            tipo_dispositivo: orderData.device.deviceType,
            estado_fisico: orderData.device.physicalCondition
          };
          if (tenantId) devPayload.tenant_id = tenantId;

          const { data: dev, error: devErr } = await supabase
            .from('dispositivos')
            .insert(devPayload)
            .select().single();
          if (devErr) throw devErr;
          deviceId = dev.id;
        }

        const abono = Number(orderData.repair.initialDeposit) || 0;
        const orderPayload: Record<string, unknown> = {
          numero_orden: orderData.orderNumber,
          id_cliente: client.id,
          id_dispositivo: deviceId,
          falla_reportada: orderData.repair.reportedIssue,
          costo_total_reparacion: Number(orderData.repair.repairTotalCost) || 0,
          abono_inicial: abono,
          estado: 'recibido'
        };
        if (tenantId) orderPayload.tenant_id = tenantId;

        const { data: order, error: orderErr } = await supabase
          .from('ordenes_servicio')
          .insert(orderPayload)
          .select().single();
        if (orderErr) throw orderErr;
        resultId = order.id;

        if (abono > 0) {
          const ingPayload: Record<string, unknown> = {
            monto: abono,
            metodo: 'efectivo',
            tipo: 'reparacion',
            descripcion: `ABONO INICIAL - ORDEN #${orderData.orderNumber}`,
            id_orden: order.id,
            id_cliente: client.id
          };
          if (tenantId) ingPayload.tenant_id = tenantId;
          await supabase.from('ingresos').insert(ingPayload);
          (orderData as OrderCreationPayload).skipIncomeRecord = true;
        }

        if (orderData.repair.evidencePhotos?.length > 0) {
          await supabase.from('fotos_evidencia').insert(
            orderData.repair.evidencePhotos.map(p => ({
              id_orden: order.id,
              etapa: p.stage,
              url_foto: p.url
            }))
          );
        }
      }

      const finalOrder = await this._getOrderById(resultId);
      return { 
        status: 'success', 
        id: resultId, 
        orderNumber: orderData.orderNumber,
        order: finalOrder || undefined
      };
    } catch (err: unknown) {
      console.error(err);
      return { status: 'error', id: '', orderNumber: '', message: err instanceof Error ? err.message : 'Error' };
    }
  },

  /**
   * Actualiza el estado de la orden.
   */
  async updateOrderStatus(id: string, status: string): Promise<StatusResponse> {
    const { error } = await supabase
      .from('ordenes_servicio')
      .update({ estado: status })
      .eq('id', id);

    if (error) throw error;
    
    const updatedOrder = await this._getOrderById(id);
    return { status: 'success', order: updatedOrder || undefined };
  },

  /**
   * Actualiza los datos de una orden.
   */
  async updateOrder(id: string, updates: Partial<ServiceOrder>): Promise<StatusResponse> {
    try {
      const { data: currentOrder, error: fetchErr } = await supabase
        .from('ordenes_servicio')
        .select('id_dispositivo, id_cliente')
        .eq('id', id)
        .single();
      
      if (fetchErr || !currentOrder) throw new Error("Orden no encontrada");

      if (updates.customer && currentOrder.id_cliente) {
        await supabase.from('clientes').update({
          nombre_completo: updates.customer.fullName,
          cedula: updates.customer.documentId,
          telefono: updates.customer.phone,
          direccion: updates.customer.address,
          email: updates.customer.email
        }).eq('id', currentOrder.id_cliente);
      }

      if (updates.device && currentOrder.id_dispositivo) {
        await supabase.from('dispositivos').update({
          marca: updates.device.brand,
          modelo: updates.device.model,
          imei_sn: updates.device.serialNumber,
          tipo_dispositivo: updates.device.deviceType,
          estado_fisico: updates.device.physicalCondition
        }).eq('id', currentOrder.id_dispositivo);
      }

      const orderUpdate: Record<string, unknown> = {};
      if (updates.status) orderUpdate.estado = updates.status;
      if (updates.repair) {
        if (updates.repair.reportedIssue !== undefined) orderUpdate.falla_reportada = updates.repair.reportedIssue;
        if (updates.repair.repairTotalCost !== undefined) orderUpdate.costo_total_reparacion = Number(updates.repair.repairTotalCost);
        if (updates.repair.initialDeposit !== undefined) orderUpdate.abono_inicial = Number(updates.repair.initialDeposit);
      }

      if (Object.keys(orderUpdate).length > 0) {
        await supabase.from('ordenes_servicio').update(orderUpdate).eq('id', id);
      }

      const updated = await this._getOrderById(id);
      return { status: 'success', order: updated || undefined };
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { status: 'error', message: msg };
    }
  },

  async deleteOrder(id: string): Promise<StatusResponse> {
    await Promise.all([
      supabase.from('ordenes_servicio').update({ eliminado: 1 }).eq('id', id),
      supabase.from('notas_venta').update({ eliminado: 1 }).eq('id', id)
    ]);
    return { status: 'success' };
  },

  _mapOrder(order: Record<string, any>): ServiceOrder {
    return {
      id: order.id.toString(),
      orderNumber: order.numero_orden,
      status: order.estado,
      createdAt: order.fecha_creacion,
      deleted: order.eliminado === 1,
      customer: order.dispositivo?.cliente ? {
        fullName: order.dispositivo.cliente.nombre_completo,
        documentId: order.dispositivo.cliente.cedula,
        phone: order.dispositivo.cliente.telefono,
        address: order.dispositivo.cliente.direccion,
        email: order.dispositivo.cliente.email,
      } : {
        fullName: order.cliente?.nombre_completo || 'Cliente Desconocido',
        documentId: order.cliente?.cedula || '',
        phone: order.cliente?.telefono || '',
        address: order.cliente?.direccion || '',
        email: order.cliente?.email || '',
      },
      device: order.dispositivo ? {
        brand: order.dispositivo.marca,
        model: order.dispositivo.modelo,
        serialNumber: order.dispositivo.imei_sn,
        deviceType: order.dispositivo.tipo_dispositivo,
        physicalCondition: order.dispositivo.estado_fisico,
      } : undefined,
      repair: {
        reportedIssue: order.falla_reportada,
        repairTotalCost: Number(order.costo_total_reparacion),
        initialDeposit: Number(order.abono_inicial),
        evidencePhotos: order.fotos ? (order.fotos as { etapa: string; url_foto: string }[]).map((f) => ({
          stage: f.etapa as any,
          url: f.url_foto
        })) : []
      }
    };
  }
};
