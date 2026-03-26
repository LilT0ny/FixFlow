// src/services/OrderService.ts
import { supabase } from '../lib/supabase';
import type { ServiceOrder, EvidencePhoto } from '../types';

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

export const OrderService = {
  /**
   * Helper privado para obtener una orden completa (con joins) por su ID.
   */
  async _getOrderById(id: string): Promise<ServiceOrder | null> {
    const { data: order, error } = await supabase
      .from('ordenes_servicio')
      .select(`
        *,
        dispositivo:dispositivos (
          *,
          cliente:clientes (*)
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
      customer: {
        fullName: order.dispositivo.cliente.nombre_completo,
        documentId: order.dispositivo.cliente.cedula,
        phone: order.dispositivo.cliente.telefono,
        address: order.dispositivo.cliente.direccion,
        email: order.dispositivo.cliente.email,
      },
      device: {
        brand: order.dispositivo.marca,
        model: order.dispositivo.modelo,
        serialNumber: order.dispositivo.imei_sn,
        deviceType: order.dispositivo.tipo_dispositivo,
        physicalCondition: order.dispositivo.estado_fisico,
      },
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
   * Busca un cliente por su número de cédula/RUC.
   */
  async checkClientByCedula(cedula: string): Promise<{ found: boolean; client?: ServiceOrder['customer'] }> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cedula', cedula)
      .maybeSingle();

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
   * Obtiene todas las órdenes, uniendo las tablas de clientes y dispositivos.
   */
  async getOrders(): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('ordenes_servicio')
      .select(`
        *,
        dispositivo:dispositivos (
          *,
          cliente:clientes (*)
        ),
        fotos:fotos_evidencia (*)
      `)
      .eq('eliminado', false)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    return (data || []).map(order => ({
      id: order.id.toString(),
      orderNumber: order.numero_orden,
      status: order.estado,
      createdAt: order.fecha_creacion,
      deleted: order.eliminado,
      customer: {
        fullName: order.dispositivo.cliente.nombre_completo,
        documentId: order.dispositivo.cliente.cedula,
        phone: order.dispositivo.cliente.telefono,
        address: order.dispositivo.cliente.direccion,
        email: order.dispositivo.cliente.email,
      },
      device: {
        brand: order.dispositivo.marca,
        model: order.dispositivo.modelo,
        serialNumber: order.dispositivo.imei_sn,
        deviceType: order.dispositivo.tipo_dispositivo,
        physicalCondition: order.dispositivo.estado_fisico,
      },
      repair: {
        reportedIssue: order.falla_reportada,
        initialDeposit: Number(order.abono_inicial),
        repairTotalCost: Number(order.costo_total_reparacion),
        evidencePhotos: order.fotos ? (order.fotos as { etapa: EvidencePhoto['stage']; url_foto: string }[]).map((f) => ({
          stage: f.etapa,
          url: f.url_foto
        })) : []
      }
    }));
  },

  /**
   * Guarda una nueva orden de servicio (Flujo: Cliente -> Dispositivo -> Orden -> Transacción)
   */
  async saveOrder(orderData: Omit<ServiceOrder, 'id' | 'createdAt'>): Promise<SaveOrderResponse> {
    try {
      // 1. Cliente (Upsert por cédula)
      const { data: client, error: clientErr } = await supabase
        .from('clientes')
        .upsert({
          nombre_completo: orderData.customer.fullName,
          cedula: orderData.customer.documentId,
          telefono: orderData.customer.phone,
          direccion: orderData.customer.address,
          email: orderData.customer.email
        }, { onConflict: 'cedula' })
        .select().single();

      if (clientErr) throw clientErr;

      // 2. Dispositivo
      const { data: device, error: deviceErr } = await supabase
        .from('dispositivos')
        .insert({
          id_cliente: client.id,
          marca: orderData.device.brand,
          modelo: orderData.device.model,
          imei_sn: orderData.device.serialNumber,
          tipo_dispositivo: orderData.device.deviceType,
          estado_fisico: orderData.device.physicalCondition
        })
        .select().single();

      if (deviceErr) throw deviceErr;

      // 3. Orden
      const abono = Number(orderData.repair.initialDeposit) || 0;
      const { data: order, error: orderErr } = await supabase
        .from('ordenes_servicio')
        .insert({
          numero_orden: orderData.orderNumber,
          id_dispositivo: device.id,
          falla_reportada: orderData.repair.reportedIssue,
          costo_total_reparacion: Number(orderData.repair.repairTotalCost) || 0,
          abono_inicial: abono,
          estado: 'recibido'
        })
        .select().single();

      if (orderErr) throw orderErr;

      // 4. Registro de pago (si hay abono)
      if (abono > 0) {
        await supabase.from('transacciones').insert({
          monto: abono,
          metodo: 'efectivo',
          tipo: 'reparacion',
          tipo_transaccion: 'ingreso',
          descripcion: `ABONO INICIAL - ORDEN #${orderData.orderNumber}`,
          id_orden: order.id
        });
      }

      // 5. Fotos
      if (orderData.repair.evidencePhotos && orderData.repair.evidencePhotos.length > 0) {
        const photos = orderData.repair.evidencePhotos.map((p) => ({
          id_orden: order.id,
          etapa: p.stage,
          url_foto: p.url
        }));
        await supabase.from('fotos_evidencia').insert(photos);
      }

      const finalOrder = await this._getOrderById(order.id.toString());
      return { 
        status: 'success', 
        id: order.id.toString(), 
        orderNumber: order.numero_orden,
        order: finalOrder || undefined
      };
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      return { status: 'error', id: '', orderNumber: '', message: msg };
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
      // Primero obtenemos la orden actual para saber el id_dispositivo
      const { data: currentOrder, error: fetchErr } = await supabase
        .from('ordenes_servicio')
        .select('id_dispositivo')
        .eq('id', id)
        .single();
      
      if (fetchErr || !currentOrder) throw new Error("Orden no encontrada");

      // Si hay actualizaciones de cliente, actualizamos el cliente del dispositivo
      if (updates.customer) {
        const { data: devData } = await supabase
          .from('dispositivos')
          .select('id_cliente')
          .eq('id', currentOrder.id_dispositivo)
          .single();
        
        if (devData) {
          await supabase.from('clientes').update({
            nombre_completo: updates.customer.fullName,
            cedula: updates.customer.documentId,
            telefono: updates.customer.phone,
            direccion: updates.customer.address,
            email: updates.customer.email
          }).eq('id', devData.id_cliente);
        }
      }

      // Si hay actualizaciones de dispositivo
      if (updates.device) {
        await supabase.from('dispositivos').update({
          marca: updates.device.brand,
          modelo: updates.device.model,
          imei_sn: updates.device.serialNumber,
          tipo_dispositivo: updates.device.deviceType,
          estado_fisico: updates.device.physicalCondition
        }).eq('id', currentOrder.id_dispositivo);
      }

      // Actualizamos la orden
      const orderUpdate: Record<string, any> = {};
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

  /**
   * Soft delete (marcar como eliminado).
   */
  async deleteOrder(id: string): Promise<StatusResponse> {
    const { error } = await supabase
      .from('ordenes_servicio')
      .update({ eliminado: true })
      .eq('id', id);

    if (error) throw error;
    return { status: 'success' };
  }
};

