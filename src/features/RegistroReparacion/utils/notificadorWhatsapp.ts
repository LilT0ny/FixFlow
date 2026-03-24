interface WhatsappParams {
  telefono: string;
  nombreCliente: string;
  marcaEquipo?: string;
  modeloEquipo?: string;
  numeroOrden: string;
}

/**
 * Notifica al cliente de su orden creada conectándoce a la API de WhatsApp.
 * 
 * @param {WhatsappParams} params Parámetros dinámicos para el mensaje.
 */
export const enviarNotificacionWhatsapp = ({
  telefono,
  nombreCliente,
  marcaEquipo,
  modeloEquipo,
  numeroOrden
}: WhatsappParams) => {
  let numeroLimpio = telefono.replace(/\D/g, '');
  if (numeroLimpio.startsWith('0')) {
    numeroLimpio = '593' + numeroLimpio.substring(1);
  }
  const mensaje = `Hola ${nombreCliente}, te informamos que tu ${marcaEquipo} ${modeloEquipo} ha sido recibido en nuestro taller con la orden #${numeroOrden}.`;
  
  const url = `https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};
