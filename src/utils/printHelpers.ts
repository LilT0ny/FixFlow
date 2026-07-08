import type { ServiceOrder, DeviceCheckInForm, PaymentTransaction, SaleItem, CustomerData } from '../types';
import type { BusinessSettings } from '../types';

type OrderForNotaVenta = ServiceOrder | (PaymentTransaction & { orderNumber?: string; total?: number; items?: SaleItem[]; description?: string; customer?: CustomerData; billingCustomer?: CustomerData; });
type OrderForTicket = (DeviceCheckInForm & { orderNumber: string; createdAt: string; billingCustomer?: CustomerData }) | ServiceOrder;



export const printReceipt = (
  order: OrderForNotaVenta | OrderForTicket,
  format: string,
  docType: 'ticket' | 'nota-venta' = 'ticket',
  isDoubleCopy: boolean = false,
  settings?: BusinessSettings
) => {
  const orderData = order as any; // Using any to handle the union of different order types safely in JS template
  const date = new Date(orderData.createdAt || orderData.date || new Date()).toLocaleDateString('es-EC');
  const time = new Date(orderData.createdAt || orderData.date || new Date()).toLocaleTimeString('es-EC', { hour12: false });

  // Datos del taller: SIEMPRE desde ajustes del tenant. Sin fallbacks con
  // datos de otro negocio — si falta un dato, se omite del ticket.
  const store = {
    name: settings?.companyName || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    ruc: settings?.ruc || '',
    logo: settings?.logo || ''
  };

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const logoHtml = store.logo
    ? `<img src="${store.logo}" style="max-width: 150px; margin-bottom: 5px;" onerror="this.style.display='none'"/>`
    : '';
  const rucHtml = store.ruc
    ? `<div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">RUC:</span><span>${esc(store.ruc)}</span></div>`
    : '';

  const isThermal = format === '58mm' || format === '80mm';
  const width = format === '80mm' ? '80mm' : (format === '58mm' ? '58mm' : '210mm');
  const fontSize = format === '58mm' ? '8pt' : (format === '80mm' ? '10pt' : '11pt');

  // Términos y condiciones: los configura cada taller en Configuración
  // (ajustes.terminos_condiciones). Sin texto configurado, no se imprimen.
  const termsText = settings?.termsConditions?.trim() || '';
  const termsHtml = termsText ? `
    <div style="font-size: ${format === 'A4' ? '9pt' : '7.5pt'}; line-height: 1.3; border-top: 1px dashed #000; padding-top: 8px; margin-top: 10px; text-align: justify; font-style: italic;">
      <strong>TÉRMINOS Y CONDICIONES:</strong><br/>
      ${esc(termsText).replace(/\n/g, '<br/>')}
      ${store.phone ? `<br/><br/><strong>WHATSAPP:</strong> ${esc(store.phone)}` : ''}
    </div>
  ` : '';

  const signaturesHtml = `
    <div style="display: flex; justify-content: space-around; margin-top: 40px; gap: 20px;">
      <div style="border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 9px; font-weight: bold;">FIRMA CLIENTE</div>
      <div style="border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 9px; font-weight: bold;">FIRMA RECIBO</div>
    </div>
  `;

  let contentHtml = '';
  let contentHtml2 = ''; // Para la segunda copia del ticket de ingreso

  const customerFullName = orderData.billingCustomer?.fullName || orderData.customer?.fullName || 'CONSUMIDOR FINAL';
  const customerDocumentId = orderData.billingCustomer?.documentId || orderData.customer?.documentId || '9999999999999';
  const customerPhone = orderData.billingCustomer?.phone || orderData.customer?.phone || 'S/N';
  const customerEmail = orderData.billingCustomer?.email || orderData.customer?.email || 'S/N';
  const customerAddress = orderData.billingCustomer?.address || orderData.customer?.address || 'QUITO';

  if (docType === 'nota-venta') {
    const totalAmount = orderData.amount || orderData.total || (typeof orderData.repair?.repairTotalCost === 'number' ? orderData.repair.repairTotalCost : 0);
    const items: SaleItem[] = orderData.items || [
      {
        id: 'SERV-01',
        description: orderData.device ? `Reparación: ${orderData.device.brand} ${orderData.device.model} - ${orderData.repair?.reportedIssue || ''}` : orderData.description || 'Servicio Técnico',
        quantity: 1,
        price: totalAmount
      }
    ];
    const nNota = orderData.orderNumber || orderData.saleNumber || 'S/N';

    contentHtml = `
      <div class="header" style="text-align: center; margin-bottom: 10px;">
        ${logoHtml}
        <h1 style="margin: 0; font-size: 8pt; text-transform: uppercase;">${esc(store.name)}</h1>
        <p style="margin: 5px 0 2px 0; font-size: 12pt; font-weight: bold;">NOTA DE VENTA</p>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">ORDEN:</span><span>${nNota}</span></div>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">FECHA:</span><span>${date} ${time}</span></div>
        <p style="margin: 2px 0;">${esc(store.address)}</p>
        ${rucHtml}
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div class="client-info" style="margin-bottom: 10px; text-transform: uppercase; font-size: ${isThermal ? '8pt' : '10pt'};">
        <p style="margin: 2px 0; font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 4px;">DATOS DEL CLIENTE</p>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">NOMBRE:</span><span>${customerFullName}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">CI/RUC:</span><span>${customerDocumentId}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">TELF:</span><span>${customerPhone}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">EMAIL:</span><span style="text-transform: none;">${customerEmail}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">DIR:</span><span>${customerAddress}</span></div>
      </div>
      <div style="border-top: 1px solid #000; margin: 5px 0;"></div>
      <table style="width: 100%; border-collapse: collapse; text-transform: uppercase; font-size: ${isThermal ? '7pt' : '9pt'};">
        <thead>
          <tr style="border-bottom: 2px solid #000;">
            <th style="text-align: center; padding: 2px;">CANT</th>
            <th style="text-align: left; padding: 2px;">DETALLE</th>
            <th style="text-align: right; padding: 2px;">P.U.</th>
            <th style="text-align: right; padding: 2px;">DESC</th>
            <th style="text-align: right; padding: 2px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px dashed #ccc;">
              <td style="text-align: center; padding: 4px 2px;">${item.quantity}</td>
              <td style="padding: 4px 2px;">${item.description}</td>
              <td style="text-align: right; padding: 4px 2px;">$${Number(item.price).toFixed(2)}</td>
              <td style="text-align: right; padding: 4px 2px;">$0.00</td>
              <td style="text-align: right; padding: 4px 2px;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; text-align: right; font-weight: bold; font-size: 12pt;">
        VALOR TOTAL: $${totalAmount.toFixed(2)}
      </div>
      <div style="margin-top: 20px; text-align: center; font-weight: bold;">¡GRACIAS POR SU CONFIANZA!</div>
      <div style="margin-top: 20px; text-align: center; font-size: 6pt;">Este documento no tiene validez tributaria. Una vez salida la mercaderia no se aceptan cambios ni devoluciones</div>  
    `;
  } else {
    // TICKET DE INGRESO
    const totalCost = Number(orderData.repair?.repairTotalCost) || 0;
    const abono = Number(orderData.repair?.initialDeposit) || 0;
    const saldo = totalCost - abono;

    const commonTicketHtml = `
      <div class="header" style="text-align: center; margin-bottom: 10px;">
        ${logoHtml}
        <h1 style="margin: 0; font-size: 8pt; text-transform: uppercase;">${esc(store.name)}</h1>
        <p style="margin: 5px 0 2px 0; font-size: 12pt; font-weight: bold;">TICKET INGRESO</p>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">ORDEN:</span><span>${orderData.orderNumber}</span></div>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">FECHA:</span><span>${date} ${time}</span></div>
        <p style="margin: 2px 0;">${esc(store.address)}</p>
        ${rucHtml}
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <div class="client-info" style="margin-bottom: 10px; text-transform: uppercase; font-size: ${isThermal ? '8pt' : '10pt'};">
        <p style="margin: 2px 0; font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 4px;">DATOS DEL CLIENTE</p>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">NOMBRE:</span><span>${customerFullName}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">CI/RUC:</span><span>${customerDocumentId}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">TELF:</span><span>${customerPhone}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">EMAIL:</span><span style="text-transform: none;">${customerEmail}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">DIR:</span><span>${customerAddress}</span></div>
      </div>
      <div style="border-top: 1px solid #000; margin: 10px 0;"></div>
      <div class="device-info" style="margin-bottom: 10px; text-transform: uppercase; font-size: ${isThermal ? '8pt' : '10pt'};">
        <p style="margin: 2px 0; font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 4px;">DATOS DEL DISPOSITIVO</p>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">EQUIPO:</span><span>${orderData.device?.brand || 'GENERAL'} ${orderData.device?.model || ''}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">IMEI:</span><span>${orderData.device?.serialNumber || 'N/A'}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">TIPO:</span><span>${orderData.device?.deviceType || 'N/A'}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">ESTADO:</span><span>${orderData.device?.physicalCondition || 'N/A'}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">FALLA:</span><span>${orderData.repair?.reportedIssue || 'N/A'}</span></div>
      </div>
      <div style="border-top: 1px solid #000; margin: 10px 0;"></div>
      <div class="financials" style="margin-bottom: 10px; font-weight: bold; text-align: center; font-size: 11pt;">
        TOTAL: $${totalCost.toFixed(2)} - ABONO: $${abono.toFixed(2)} = SALDO: $${saldo.toFixed(2)}
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
    `;

    // Primera copia: Todo menos las firmas (con términos)
    contentHtml = `
      ${commonTicketHtml}
      ${termsHtml}
      <div style="margin-top: 20px; text-align: center; font-weight: bold;">¡GRACIAS POR SU CONFIANZA!</div>
    `;

    // Segunda copia: Todo menos los términos (con firmas)
    contentHtml2 = `
      ${commonTicketHtml}
      ${signaturesHtml}
      <div style="margin-top: 20px; text-align: center; font-weight: bold;">¡GRACIAS POR SU CONFIANZA!</div>
    `;
  }

  const finalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: ${format === 'A4' ? '15mm' : '0mm'}; size: ${isThermal ? width + ' auto' : 'A4'}; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            width: ${isThermal ? (format === '80mm' ? '76mm' : '52mm') : '100%'}; 
            margin: 0 auto; 
            padding: ${isThermal ? '2mm' : '0'}; 
            color: #000; 
            font-size: ${fontSize}; 
            line-height: 1.2; 
          }
          .copy-container { margin-bottom: 30px; }
          .page-break { page-break-before: always; border-top: 1px dashed #000; margin: 20px 0; padding-top: 20px; }
          img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
          p { margin: 4px 0; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div class="copy-container">
          ${contentHtml}
        </div>
        
        ${(docType === 'ticket' || isDoubleCopy) && contentHtml2 ? `
          <div class="page-break">
            ${contentHtml2}
          </div>
        ` : ''}
      </body>
    </html>
  `;

  // Impresión vía iframe oculto con srcdoc: sin pop-ups, sin la carrera de
  // document.write + print() que producía previsualizaciones en blanco.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');

  const cleanup = () => iframe.remove();

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      return;
    }
    // Pequeño margen para que carguen las imágenes (logo) antes del diálogo
    setTimeout(() => {
      win.onafterprint = cleanup;
      win.focus();
      win.print();
      // Respaldo por si onafterprint no dispara en algún navegador
      setTimeout(cleanup, 60_000);
    }, 300);
  };

  iframe.srcdoc = finalHtml;
  document.body.appendChild(iframe);
};

export const printReceiptDoubleCopy = (
  order: OrderForNotaVenta | OrderForTicket,
  format: string,
  docType: 'ticket' | 'nota-venta' = 'ticket',
  settings?: BusinessSettings
) => {
  // Ahora solo imprime una copia por requerimiento del usuario
  printReceipt(order, format, docType, false, settings);
};
