import { useState, useCallback, useEffect } from 'react';
import { OrderService } from '../services/OrderService';
import type { ServiceOrder, DeviceCheckInForm, OrderStatus } from '../types';

// ─── Debug flag ────────────────────────────────────────────────────────────────
// Set to false before production deployment
const API_DEBUG = true;

function dbg(label: string, ...args: unknown[]) {
  if (API_DEBUG) console.log(`%c[API:${label}]`, 'color:#6366f1;font-weight:bold', ...args);
}
function dbgError(label: string, ...args: unknown[]) {
  if (API_DEBUG) console.error(`%c[API:${label}]`, 'color:#ef4444;font-weight:bold', ...args);
}

// ─────────────────────────────────────────────────────────────────────────────

export function useOrders() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error,   setError]   = useState<string | null>(null);

  /**
   * Carga todas las órdenes activas desde la BD.
   * NOTA: setOrders solo se llama con un array válido para evitar
   * sobrescribir el estado con null/undefined durante la carga.
   */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Línea 31
      dbg('fetchOrders', '→ Iniciando consulta a Supabase (ordenes_servicio)');
      const data = await OrderService.getOrders();
      dbg('fetchOrders', '← respuesta:', data);
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        // Nunca sobreescribir el estado con algo que no sea un array
        dbgError('fetchOrders', 'La respuesta no es un array — estado no modificado:', data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching orders';
      dbgError('fetchOrders', 'ERROR:', msg);
      setError(msg);
      // NO limpiamos setOrders([]) aquí — preservamos el estado actual
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra un nuevo ingreso de equipo (REP) o nota de venta (NT).
   * El número de orden lo asigna el SERVIDOR (contador por tenant) —
   * el cliente nunca lo genera.
   */
  const addOrder = useCallback(async (data: DeviceCheckInForm, kind: 'REP' | 'NT' = 'REP'): Promise<ServiceOrder> => {
    const orderToSave: Omit<ServiceOrder, 'id' | 'createdAt' | 'orderNumber'> & { paymentMethod?: string; skipIncomeRecord?: boolean } = {
      ...data,
      status: 'recibido' as OrderStatus
    };

    dbg('addOrder', '→ payload enviado:', JSON.stringify(orderToSave, null, 2));

    try {
      const result = await OrderService.saveOrder(orderToSave, kind);
      dbg('addOrder', '← respuesta DB:', result);

      if (result.status === 'success') {
        const newOrder: ServiceOrder = result.order ?? {
          id:          result.id,
          orderNumber: result.orderNumber,
          customer:    data.customer,
          device:      data.device,
          repair:      data.repair,
          status:      'recibido',
          createdAt:   new Date().toISOString()
        };
        // Solo las órdenes de reparación (REP) viven en esta lista — una
        // nota de venta directa (NT sin orden) no tiene fila propia acá,
        // así que NUNCA se inyecta: evita una fila fantasma en la tabla.
        if (kind === 'REP') {
          setOrders(prev => [newOrder, ...prev]);
        }
        return newOrder;
      } else {
        throw new Error(result.message || 'Error en la base de datos al guardar la orden');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      dbgError('addOrder', 'ERROR:', msg);
      throw err;
    }
  }, []);

  /**
   * Actualiza el estado de una orden en la BD con trazabilidad completa.
   * - Loguea el payload exacto enviado al servidor.
   * - Loguea el HTTP status y la respuesta cruda.
   * - Si el servidor devuelve algo que NO es { status: 'success' }, lanza
   *   un error y NO limpia el estado de la orden.
   * - El re-fetch solo ocurre si la API confirma éxito.
   *
   * @param {string} id - ID de la orden cuyo estado se cambia.
   * @param {OrderStatus} status - Nuevo estado a establecer.
   */
  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const payload = { id, status };

    // Optimistic UI solo para estados que no son "entregado"
    // (entregado requiere confirmación del servidor antes de actualizar)
    if (status !== 'entregado') {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    }

    dbg('updateOrderStatus', '→ payload enviado al PHP:', JSON.stringify(payload, null, 2));

    try {
      const response = await OrderService.updateOrderStatus(id, status);
      dbg('updateOrderStatus', '← HTTP OK — respuesta JSON:', response);

      if (response.status !== 'success') {
        // El servidor respondió pero indicó fallo — revertir estado
        dbgError('updateOrderStatus', 'El servidor devolvió status!=success:', response);
        throw new Error(response.message || 'Error al actualizar el estado de la orden');
      }

      // Si el servidor nos devolvió la orden actualizada, usarla directamente
      // para evitar un re-fetch que pueda provocar "parpadeo" visual
      if (response.order) {
        dbg('updateOrderStatus', '↺ Aplicando orden devuelta por el servidor:', response.order);
        setOrders(prev => prev.map(o => o.id === id ? response.order! : o));
      }

      // Re-fetch para garantizar consistencia F5-proof
      await fetchOrders();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error contactando el servidor';
      dbgError('updateOrderStatus', 'ERROR — Estado NO modificado. Revirtiendo:', msg);
      // Revertir el optimistic update
      await fetchOrders();
      // Re-lanzar para que el caller (useDeviceList) mantenga el modal abierto
      throw new Error(msg);
    }
  }, [fetchOrders]);

  /**
   * Actualiza los datos de una orden (cliente, dispositivo, costos) en la BD.
   * @param {string} id - ID de la orden a actualizar.
   * @param {Partial<ServiceOrder>} updates - Campos a actualizar.
   */
  const updateOrder = useCallback(async (id: string, updates: Partial<ServiceOrder>) => {
    dbg('updateOrder', '→ payload enviado al PHP:', JSON.stringify({ id, ...updates }, null, 2));

    // Actualización optimista inmediata en UI (muestra cambios antes que la BD responda)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

    try {
      const response = await OrderService.updateOrder(id, updates);
      dbg('updateOrder', '← respuesta DB:', response);

      if (response.status !== 'success') {
        throw new Error(response.message || 'Error al actualizar la orden');
      }

      // Aplicar directamente la orden devuelta por el servidor (sin parpadeo)
      if (response.order) {
        dbg('updateOrder', '↺ Aplicando orden devuelta por servidor:', response.order);
        setOrders(prev => prev.map(o => o.id === id ? response.order! : o));
      }

      // Re-fetch completo para persistencia F5-proof
      await fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      dbgError('updateOrder', 'ERROR:', msg);
      alert('Error al guardar cambios: ' + msg);
      await fetchOrders();
      // Re-lanzar para que el caller (confirmEditSave) pueda detectar el fallo
      throw new Error(msg);
    }
  }, [fetchOrders]);


  /**
   * Soft-delete de una orden (flag eliminado=1 en la BD).
   * @param {string} id - ID de la orden a eliminar.
   */
  const deleteOrder = useCallback(async (id: string) => {
    dbg('deleteOrder', '→ id:', id);

    // Optimistic UI: ocultar inmediatamente
    setOrders(prev => prev.map(o => o.id === id ? { ...o, deleted: true } : o));

    try {
      const response = await OrderService.deleteOrder(id);
      dbg('deleteOrder', '← respuesta DB:', response);

      if (response.status !== 'success') {
        throw new Error(response.message || 'Error al eliminar la orden');
      }
      await fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      dbgError('deleteOrder', 'ERROR:', msg);
      alert('Error al eliminar: ' + msg);
      await fetchOrders();
    }
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders: orders.filter(o => !o.deleted),
    loading,
    error,
    addOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    refreshOrders: fetchOrders
  };
}
