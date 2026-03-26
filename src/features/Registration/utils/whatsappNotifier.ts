interface WhatsappParams {
  phone: string;
  customerName: string;
  deviceBrand?: string;
  deviceModel?: string;
  orderNumber: string;
  total?: number;
  abono?: number;
  statusLabel?: string;
  template?: string;
}

/**
 * Notifies the customer of their created order by connecting to the WhatsApp API.
 * 
 * @param {WhatsappParams} params Dynamic parameters for the message.
 */
export const sendWhatsappNotification = ({
  phone,
  customerName,
  deviceBrand,
  deviceModel,
  orderNumber,
  total = 0,
  abono = 0,
  statusLabel = 'recibido',
  template = 'Hola {{customer}}, te informamos que tu {{device}} ({{model}}) se encuentra en estado: {{status}}. Total: ${{total}}. Saldo pendiente: ${{saldo}}.'
}: WhatsappParams) => {
  let cleanNumber = phone.replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '593' + cleanNumber.substring(1);
  }

  const device = deviceBrand || 'dispositivo';
  const model = deviceModel || '';
  const saldo = total - abono;
  
  const message = template
    .replace(/{{customer}}/g, customerName)
    .replace(/{{device}}/g, device)
    .replace(/{{model}}/g, model)
    .replace(/{{status}}/g, statusLabel)
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{total}}/g, total.toFixed(2))
    .replace(/{{abono}}/g, abono.toFixed(2))
    .replace(/{{saldo}}/g, saldo.toFixed(2));
  
  const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
