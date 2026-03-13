import type { ServiceOrder, DeviceCheckInForm } from '../types';

export const printReceipt = (
  order: ServiceOrder | (DeviceCheckInForm & { orderNumber: string; createdAt: string }),
  format: string
) => {
  let width = '100%';
  if (format === '58mm') width = '58mm';
  if (format === '80mm') width = '80mm';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para imprimir.');
    return;
  }

  const date = new Date(order.createdAt).toLocaleDateString();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo - ${order.orderNumber}</title>
        <style>
          @page { margin: ${format === 'A4' ? '15mm' : '5mm'}; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            width: ${width};
            margin: 0 auto;
            padding: ${format === 'A4' ? '20px' : '5px'};
            box-sizing: border-box;
            background: #fff;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: ${format === 'A4' ? '24px' : '16px'}; text-transform: uppercase; font-weight: bold; }
          .header p { margin: 5px 0 0; font-size: ${format === 'A4' ? '14px' : '12px'}; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; font-size: ${format === 'A4' ? '16px' : '12px'}; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: ${format === 'A4' ? '14px' : '12px'}; }
          .row span.label { font-weight: bold; }
          .row span.val { text-align: right; word-break: break-word; max-width: 70%; }
          .footer { text-align: center; margin-top: 20px; font-size: ${format === 'A4' ? '12px' : '10px'}; border-top: 1px dashed #000; padding-top: 10px; }
          
          /* Custom overrides for thermal */
          ${format !== 'A4' ? `
            body { font-size: 11px; padding: 0; }
            .row { flex-direction: column; margin-bottom: 8px; gap: 2px; align-items: flex-start; }
            .row span.val { text-align: left; max-width: 100%; margin-left: 5px; }
          ` : ''}

          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Servicio Técnico</h1>
          <p>Orden #${order.orderNumber}</p>
          <p>Fecha: ${date}</p>
        </div>

        <div class="section">
          <div class="section-title">Datos del Cliente</div>
          <div class="row"><span class="label">Nombre:</span> <span class="val">${order.customer.fullName}</span></div>
          <div class="row"><span class="label">C.I.:</span> <span class="val">${order.customer.documentId}</span></div>
          <div class="row"><span class="label">Teléfono:</span> <span class="val">${order.customer.phone}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Detalle del Equipo</div>
          <div class="row"><span class="label">Equipo:</span> <span class="val">${order.device.brand} ${order.device.model}</span></div>
          <div class="row"><span class="label">IMEI/Serial:</span> <span class="val">${order.device.serialNumber}</span></div>
          <div class="row"><span class="label">Falla:</span> <span class="val">${order.repair.reportedIssue}</span></div>
          <div class="row"><span class="label">Estado Fisico:</span> <span class="val">${order.device.physicalCondition}</span></div>
        </div>

        <div class="footer">
          <p>¡Gracias por su preferencia!</p>
          <p>Conserve este recibo para retirar su equipo.</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait a small delay to ensure rendering before printing
  setTimeout(() => {
    printWindow.print();
    // Close the window after print dialog is closed
    // Note: in some browsers this closes immediately, so we keep it open for user to review if needed, 
    // or uncomment next line to auto-close:
    // printWindow.close();
  }, 250);
};
