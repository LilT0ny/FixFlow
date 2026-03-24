import { useState, useCallback } from 'react';
import { useOrders } from '../../../hooks/useOrders';
import type { DeviceCheckInForm, ServiceOrder } from '../../../types';
import { enviarNotificacionWhatsapp } from '../utils/notificadorWhatsapp';

/**
 * Hook personalizado que maneja la lógica de estado y red para el registro de reparaciones.
 * Evita que los componentes visuales manejen datos complejos y peticiones.
 * 
 * @returns {Object} Variables de estado y funciones de mutación para la vista.
 */
export const useRegistroReparacion = () => {
  const { addOrder } = useOrders();
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [estaEnviando, setEstaEnviando] = useState<boolean>(false);
  const [ordenCreada, setOrdenCreada] = useState<ServiceOrder | null>(null);
  const [errorPeticion, setErrorPeticion] = useState<string | null>(null);

  /**
   * Procesa el formulario, lo envía al backend y notifica al cliente si tiene éxito.
   * 
   * @param {DeviceCheckInForm} datosRegistro - Toda la información de cliente, equipo y reparación.
   */
  const procesarRegistro = useCallback(async (datosRegistro: DeviceCheckInForm) => {
    setEstaEnviando(true);
    setErrorPeticion(null);

    try {
      const { customer: infoCliente, device: infoEquipo } = datosRegistro;
      
      const nuevaOrden = await addOrder(datosRegistro);
      setOrdenCreada(nuevaOrden);

      if (infoCliente?.phone) {
        enviarNotificacionWhatsapp({
          telefono: infoCliente.phone,
          nombreCliente: infoCliente.fullName,
          marcaEquipo: infoEquipo?.brand,
          modeloEquipo: infoEquipo?.model,
          numeroOrden: nuevaOrden.orderNumber
        });
      }
    } catch (error) {
      console.error('Error durante el registro de reparación:', error);
      setErrorPeticion('Ocurrió un error al guardar en la base de datos. Intente nuevamente.');
    } finally {
      setEstaEnviando(false);
    }
  }, [addOrder]);

  return {
    pasoActual,
    setPasoActual,
    procesarRegistro,
    estaEnviando,
    ordenCreada,
    errorPeticion,
    reiniciarRegistro: useCallback(() => {
      setPasoActual(1);
      setOrdenCreada(null);
    }, [])
  };
};
