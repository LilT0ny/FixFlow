import type { ServiceOrder, DeviceCheckInForm, PaymentTransaction, SaleItem, CustomerData } from '../types';
import type { BusinessSettings } from '../store/SettingsContext';

type OrderForNotaVenta = ServiceOrder | (PaymentTransaction & { orderNumber?: string; total?: number; items?: SaleItem[]; description?: string; customer?: CustomerData; billingCustomer?: CustomerData; });
type OrderForTicket = (DeviceCheckInForm & { orderNumber: string; createdAt: string; billingCustomer?: CustomerData }) | ServiceOrder;



export const printReceipt = (
  order: OrderForNotaVenta | OrderForTicket,
  format: string,
  docType: 'ticket' | 'nota-venta' = 'ticket',
  isDoubleCopy: boolean = false,
  settings?: BusinessSettings
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para imprimir.');
    return;
  }

  const orderData = order as any; // Using any to handle the union of different order types safely in JS template
  const date = new Date(orderData.createdAt || orderData.date || new Date()).toLocaleDateString('es-EC');
  const time = new Date(orderData.createdAt || orderData.date || new Date()).toLocaleTimeString('es-EC', { hour12: false });
  
  const store = {
    name: settings?.companyName || 'CELL REPAIR CENTER',
    address: settings?.address || 'JOSE GUERRERO Y LIZARDO RUIZ, QUITO',
    phone: settings?.phone || '0998075071',
    ruc: settings?.ruc || '1792456789001',
    logo: settings?.logo || './Logo.svg'
  };

  const isThermal = format === '58mm' || format === '80mm';
  const width = format === '80mm' ? '80mm' : (format === '58mm' ? '58mm' : '210mm');
  const fontSize = format === '58mm' ? '8pt' : (format === '80mm' ? '10pt' : '11pt');

  const termsHtml = `
    <div style="font-size: ${format === 'A4' ? '9pt' : '7.5pt'}; line-height: 1.3; border-top: 1px dashed #000; padding-top: 8px; margin-top: 10px; text-align: justify; font-style: italic;">
      <strong>TÉRMINOS Y CONDICIONES:</strong><br/>
      Agradecemos su confianza y hacemos de su conocimiento las siguientes condiciones de servicio:<br/>
      - Después de 30 días los equipos pueden ser usados como remate o refacción sin responsabilidad de nuestra parte.<br/>
      - Retire el chip y memoria, no nos hacemos responsables por tales pérdidas.<br/>
      - En equipos mojados, software, dañados por mal uso, intervenidos no hay garantía.<br/>
      - Si requiere más tiempo, solicite una nueva nota con ficha nueva.<br/>
      - La entrega del equipo solo será con nota o identificación.<br/>
      - Los reemplazos de piezas cuentan con 30 días de garantía contra defectos de fábrica. No aplica garantía si el equipo presenta daño por golpe, humedad o mal uso. Pueden existir variaciones entre la pieza origonal y reemplazo: logo, tonalidad de color, material, etc.<br/>
      - Los tiempos para liberación por código y vía por servicios, son establecidos por proveedores terceros, en raras ocasiones pueden retrasarse. No habrá reembolso hasta completada la orden. La liberación de compañía no elimina el reporte de robo o extravío.<br/>
      - El tiempo de entrega puede retrasarse cuando la refaccion viene de proveedores externos.<br/>
      <br/><br/>
      <strong>WHATSAPP:</strong> ${store.phone}
    </div>
  `;

  const signaturesHtml = `
    <div style="display: flex; justify-content: space-around; margin-top: 40px; gap: 20px;">
      <div style="border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 9px; font-weight: bold;">FIRMA CLIENTE</div>
      <div style="border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 9px; font-weight: bold;">FIRMA RECIBO</div>
    </div>
  `;

  let contentHtml = '';

  const customerFullName = orderData.customer?.fullName || orderData.billingCustomer?.fullName || 'CONSUMIDOR FINAL';
  const customerDocumentId = orderData.customer?.documentId || orderData.billingCustomer?.documentId || '9999999999999';
  const customerPhone = orderData.customer?.phone || 'S/N';
  const customerEmail = orderData.customer?.email || 'S/N';
  const customerAddress = orderData.customer?.address || orderData.billingCustomer?.address || 'QUITO';

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
        <img src="${store.logo}" style="max-width: 150px; margin-bottom: 5px;" onerror="this.style.display='none'"/>
        <h1 style="margin: 0; font-size: 8pt; text-transform: uppercase;">${store.name}</h1>
        <p style="margin: 5px 0 2px 0; font-size: 12pt; font-weight: bold;">NOTA DE VENTA</p>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">ORDEN:</span><span>${nNota}</span></div>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">FECHA:</span><span>${date} ${time}</span></div>
        <p style="margin: 2px 0;">${store.address}</p>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">RUC:</span><span>${store.ruc}</span></div>
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
      <div style="margin-top: 20px; text-align: center; font-size: 2pt;">Este documento no tiene validez tributaria. Una vez salida la mercaderia no se aceptan cambios ni devoluciones</div>  
    `;
  } else {
    // TICKET DE INGRESO
    const totalCost = Number(orderData.repair?.repairTotalCost) || 0;
    const abono = Number(orderData.repair?.initialDeposit) || 0;
    const saldo = totalCost - abono;

    contentHtml = `
      <div class="header" style="text-align: center; margin-bottom: 10px;">
        <img src="${store.logo}" style="max-width: 150px; margin-bottom: 5px;" onerror="this.style.display='none'"/>
        <h1 style="margin: 0; font-size: 8pt; text-transform: uppercase;">${store.name}</h1>
        <p style="margin: 5px 0 2px 0; font-size: 12pt; font-weight: bold;">TICKET INGRESO</p>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">ORDEN:</span><span>${orderData.orderNumber}</span></div>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">FECHA:</span><span>${date} ${time}</span></div>
        <p style="margin: 2px 0;">${store.address}</p>
        <div style="display: flex; justify-content: center; gap: 5px;"><span style="font-weight: bold;">RUC:</span><span>${store.ruc}</span></div>
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
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">EQUIPO:</span><span>${orderData.device?.brand} ${orderData.device?.model}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">IMEI:</span><span>${orderData.device?.serialNumber || 'N/A'}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">TIPO:</span><span>${orderData.device?.deviceType || 'CELULAR'}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">ESTADO:</span><span>${orderData.device?.physicalCondition}</span></div>
        <div style="display: flex; gap: 4px;"><span style="font-weight: bold; min-width: max-content;">FALLA:</span><span>${orderData.repair?.reportedIssue}</span></div>
      </div>
      <div style="border-top: 1px solid #000; margin: 10px 0;"></div>
      <div class="financials" style="margin-bottom: 10px; font-weight: bold; text-align: center; font-size: 11pt;">
        TOTAL: $${totalCost.toFixed(2)} - ABONO: $${abono.toFixed(2)} = SALDO: $${saldo.toFixed(2)}
      </div>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      ${termsHtml}
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
          .page-break { page-break-after: always; border-top: 2px dashed #000; margin: 20px 0; padding-top: 20px; }
          img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
          p { margin: 4px 0; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div class="copy-container">
          <div style="text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 10px; border-bottom: 1px solid #000;">*** COPIA LOCAL ***</div>
          ${contentHtml}
        </div>
        
        ${isDoubleCopy ? `
          <div class="page-break">
            <div style="text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 10px; border-bottom: 1px solid #000;">*** COPIA CLIENTE ***</div>
            ${contentHtml}
          </div>
        ` : ''}
      </body>
    </html>
  `;

  printWindow.document.write(finalHtml);
  printWindow.document.close();
  
  // Wait for content and images to load
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // On some browsers, we might need a small delay after print dialog opens
      // printWindow.close(); // Not closing automatically to let user see it if print fails
    }, 500);
  };

  // Fallback for onload not firing (common in some browsers with document.write)
  setTimeout(() => {
    if (printWindow.document.readyState === 'complete') {
      printWindow.focus();
      printWindow.print();
    }
  }, 1500);
};

export const printReceiptDoubleCopy = (
  order: OrderForNotaVenta | OrderForTicket,
  format: string,
  docType: 'ticket' | 'nota-venta' = 'ticket',
  settings?: BusinessSettings
) => {
  printReceipt(order, format, docType, true, settings);
};
