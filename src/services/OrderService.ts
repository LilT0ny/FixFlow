// src/services/OrderService.ts
import { supabase } from '../lib/supabase';
import type { ServiceOrder, EvidencePhoto, OrderStatus, DeviceCheckInForm } from '../types';

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

/** Select con todos los embeds del esquema v2: cliente vía dispositivo,
 *  trabajos + transacciones para calcular total/abonado. */
const ORDER_SELECT = `
  *,
  dispositivo:dispositivo_id (*, cliente:cliente_id (*)),
  fotos:fotos_evidencia (*),
  trabajos:orden_trabajo (id, descripcion, costo),
  pagos:transacciones (monto, tipo)
`;

type OrderRow = Record<string, any>;

function mapOrder(order: OrderRow): ServiceOrder {
  const trabajos: { costo: number }[] = order.trabajos || [];
  const pagos: { monto: number; tipo: string }[] = order.pagos || [];
  const total = trabajos.reduce((sum, t) => sum + Number(t.costo), 0);
  const abonado = pagos
    .filter(p => p.tipo === 'ingreso')
    .reduce((sum, p) => sum + Number(p.monto), 0);
  const cliente = order.dispositivo?.cliente;

  return {
    id: order.id,
    orderNumber: order.numero_orden,
    status: order.estado,
    createdAt: order.created_at,
    deleted: order.deleted_at != null,
    customer: {
      fullName: cliente?.nombre_completo || 'Cliente Desconocido',
      documentId: cliente?.cedula || '',
      phone: cliente?.telefono || '',
      address: cliente?.direccion || '',
      email: cliente?.email || '',
    },
    device: order.dispositivo ? {
      brand: order.dispositivo.marca,
      model: order.dispositivo.modelo,
      serialNumber: order.dispositivo.imei_sn || '',
      deviceType: order.dispositivo.tipo,
      physicalCondition: order.dispositivo.estado_fisico,
    } : undefined,
    repair: {
      reportedIssue: order.falla_reportada,
      repairTotalCost: total,
      initialDeposit: abonado,
      evidencePhotos: (order.fotos || []).map((f: { etapa: EvidencePhoto['stage']; url_foto: string }) => ({
        stage: f.etapa,
        url: f.url_foto,
      })),
    },
  };
}

export const OrderService = {
  /**
   * Helper privado para obtener una orden completa (con joins) por su ID.
   */
  async _getOrderById(id: string): Promise<ServiceOrder | null> {
    const { data: order, error } = await supabase
      .from('ordenes_servicio')
      .select(ORDER_SELECT)
      .eq('id', id)
      .single();

    if (error || !order) return null;
    return mapOrder(order);
  },

  /**
   * Busca un cliente por su número de cédula/RUC (RLS filtra por tenant).
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
   * Obtiene todas las órdenes y notas de venta activas (RLS filtra por tenant).
   */
  async getOrders(): Promise<ServiceOrder[]> {
    const [repRes, ntRes] = await Promise.all([
      supabase.from('ordenes_servicio')
        .select(ORDER_SELECT)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('notas_venta')
        .select(`*, cliente:cliente_id (*), items:nota_venta_item (descripcion, cantidad, precio_unitario)`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ]);

    if (repRes.error) throw repRes.error;
    if (ntRes.error) throw ntRes.error;

    const repairs = (repRes.data || []).map(order => mapOrder(order));

    const sales = (ntRes.data || []).map(nt => {
      const items: { descripcion: string; cantidad: number; precio_unitario: number }[] = nt.items || [];
      const total = items.reduce((sum, i) => sum + i.cantidad * Number(i.precio_unitario), 0);
      return {
        id: nt.id,
        orderNumber: nt.numero_nota,
        status: 'entregado' as OrderStatus,
        createdAt: nt.created_at,
        deleted: nt.deleted_at != null,
        customer: {
          fullName: nt.cliente?.nombre_completo || 'Cliente Desconocido',
          documentId: nt.cliente?.cedula || '',
          phone: nt.cliente?.telefono || '',
          address: nt.cliente?.direccion || '',
          email: nt.cliente?.email || '',
        },
        repair: {
          reportedIssue: items.map(i => i.descripcion).join(', ') || 'VENTA DIRECTA',
          repairTotalCost: total,
          initialDeposit: total,
          evidencePhotos: []
        }
      };
    });

    return [...repairs, ...sales].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Registra una nueva orden (REP) o Nota de Venta (NT) vía RPC transaccional.
   * La numeración la asigna el servidor (contadores por tenant).
   */
  async saveOrder(
    orderData: Omit<ServiceOrder, 'id' | 'createdAt' | 'orderNumber'> & { orderNumber?: string },
    kind: 'REP' | 'NT' = 'REP'
  ): Promise<SaveOrderResponse> {
    try {
      const method = (orderData as OrderCreationPayload).paymentMethod || 'efectivo';

      if (kind === 'NT') {
        // Cliente opcional: si viene con cédula, upsert previo para vincularlo
        let clienteId: string | null = null;
        if (orderData.customer?.documentId) {
          const { data: client, error: clientErr } = await supabase
            .from('clientes')
            .upsert({
              nombre_completo: orderData.customer.fullName,
              cedula: orderData.customer.documentId,
              telefono: orderData.customer.phone || '',
              direccion: orderData.customer.address,
              email: orderData.customer.email || null,
            }, { onConflict: 'tenant_id,cedula' })
            .select('id')
            .single();
          if (clientErr) throw clientErr;
          clienteId = client.id;
        }

        const { data, error } = await supabase.rpc('crear_nota_venta', {
          p_items: [{
            descripcion: orderData.repair.reportedIssue || 'VENTA DIRECTA',
            cantidad: 1,
            precio_unitario: Number(orderData.repair.repairTotalCost) || 0,
          }],
          p_metodo: method,
          p_cliente_id: clienteId,
          p_registrar_ingreso: !(orderData as OrderCreationPayload).skipIncomeRecord,
        });
        if (error) throw error;

        return {
          status: 'success',
          id: data.nota_id,
          orderNumber: data.numero_nota,
        };
      }

      // FLUJO REP: una sola RPC transaccional (cliente + dispositivo + orden +
      // trabajos + fotos + abono en transacciones — todo o nada)
      const { data, error } = await supabase.rpc('crear_orden_completa', {
        p_cliente: {
          nombre_completo: orderData.customer.fullName,
          cedula: orderData.customer.documentId,
          telefono: orderData.customer.phone || '',
          email: orderData.customer.email || '',
          direccion: orderData.customer.address || '',
        },
        p_dispositivo: {
          tipo: orderData.device?.deviceType || 'otro',
          marca: orderData.device?.brand || 'N/D',
          modelo: orderData.device?.model || 'N/D',
          imei_sn: orderData.device?.serialNumber || '',
          estado_fisico: orderData.device?.physicalCondition || '',
        },
        p_trabajos: [{
          descripcion: 'Reparación',
          costo: Number(orderData.repair.repairTotalCost) || 0,
        }],
        p_falla: orderData.repair.reportedIssue,
        p_abono: Number(orderData.repair.initialDeposit) || 0,
        p_metodo_abono: method,
        p_fotos: (orderData.repair.evidencePhotos || []).map(p => ({
          etapa: p.stage,
          url_foto: p.url,
        })),
      });
      if (error) throw error;

      const finalOrder = await this._getOrderById(data.orden_id);
      return {
        status: 'success',
        id: data.orden_id,
        orderNumber: data.numero_orden,
        order: finalOrder || undefined
      };
    } catch (err: unknown) {
      console.error(err);
      return { status: 'error', id: '', orderNumber: '', message: err instanceof Error ? err.message : 'Error' };
    }
  },

  /**
   * Actualiza el estado de la orden (el historial lo escribe un trigger).
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
   * Actualiza los datos de una orden (cliente vía dispositivo, trabajos y abono).
   */
  async updateOrder(id: string, updates: Partial<ServiceOrder>): Promise<StatusResponse> {
    try {
      const { data: currentOrder, error: fetchErr } = await supabase
        .from('ordenes_servicio')
        .select('id, dispositivo_id, dispositivo:dispositivo_id (cliente_id)')
        .eq('id', id)
        .single();

      if (fetchErr || !currentOrder) throw new Error("Orden no encontrada");

      const clienteId = (currentOrder.dispositivo as unknown as { cliente_id: string } | null)?.cliente_id;

      if (updates.customer && clienteId) {
        const { error } = await supabase.from('clientes').update({
          nombre_completo: updates.customer.fullName,
          cedula: updates.customer.documentId,
          telefono: updates.customer.phone,
          direccion: updates.customer.address,
          email: updates.customer.email
        }).eq('id', clienteId);
        if (error) throw error;
      }

      if (updates.device && currentOrder.dispositivo_id) {
        const { error } = await supabase.from('dispositivos').update({
          marca: updates.device.brand,
          modelo: updates.device.model,
          imei_sn: updates.device.serialNumber,
          tipo: updates.device.deviceType,
          estado_fisico: updates.device.physicalCondition
        }).eq('id', currentOrder.dispositivo_id);
        if (error) throw error;
      }

      const orderUpdate: Record<string, unknown> = {};
      if (updates.status) orderUpdate.estado = updates.status;
      if (updates.repair?.reportedIssue !== undefined) orderUpdate.falla_reportada = updates.repair.reportedIssue;
      if (Object.keys(orderUpdate).length > 0) {
        const { error } = await supabase.from('ordenes_servicio').update(orderUpdate).eq('id', id);
        if (error) throw error;
      }

      // Total de reparación: la UI maneja un único monto → una fila en orden_trabajo
      if (updates.repair?.repairTotalCost !== undefined) {
        const nuevoTotal = Number(updates.repair.repairTotalCost) || 0;
        await supabase.from('orden_trabajo').delete().eq('orden_id', id);
        const { error } = await supabase.from('orden_trabajo').insert({
          orden_id: id,
          descripcion: 'Reparación',
          costo: nuevoTotal,
        });
        if (error) throw error;
      }

      // Abono inicial: vive en transacciones; se ajusta la fila de abono si existe
      if (updates.repair?.initialDeposit !== undefined) {
        const nuevoAbono = Number(updates.repair.initialDeposit) || 0;
        const { data: abonoRow } = await supabase
          .from('transacciones')
          .select('id')
          .eq('orden_id', id)
          .eq('tipo', 'ingreso')
          .like('descripcion', 'ABONO INICIAL%')
          .maybeSingle();

        if (abonoRow && nuevoAbono > 0) {
          await supabase.from('transacciones').update({ monto: nuevoAbono }).eq('id', abonoRow.id);
        } else if (abonoRow && nuevoAbono === 0) {
          await supabase.from('transacciones').delete().eq('id', abonoRow.id);
        } else if (!abonoRow && nuevoAbono > 0) {
          await supabase.from('transacciones').insert({
            tipo: 'ingreso',
            monto: nuevoAbono,
            metodo: 'efectivo',
            categoria: 'reparacion',
            descripcion: 'ABONO INICIAL - AJUSTE',
            orden_id: id,
            cliente_id: clienteId,
          });
        }
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
   * Soft-delete (deleted_at). El id puede ser de una orden o de una nota de venta;
   * el update sobre la tabla equivocada simplemente no afecta filas.
   */
  async deleteOrder(id: string): Promise<StatusResponse> {
    const deletedAt = new Date().toISOString();
    await Promise.all([
      supabase.from('ordenes_servicio').update({ deleted_at: deletedAt }).eq('id', id),
      supabase.from('notas_venta').update({ deleted_at: deletedAt }).eq('id', id)
    ]);
    return { status: 'success' };
  },
};
