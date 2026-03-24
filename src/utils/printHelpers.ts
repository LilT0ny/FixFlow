import type { ServiceOrder, DeviceCheckInForm, PaymentTransaction, SaleItem, CustomerData } from '../types';

type OrderForNotaVenta = ServiceOrder | (PaymentTransaction & { orderNumber?: string; total?: number; items?: SaleItem[]; description?: string; customer?: CustomerData; billingCustomer?: CustomerData; });
type OrderForTicket = DeviceCheckInForm & { orderNumber: string; createdAt: string; billingCustomer?: CustomerData };
type PrintableOrderData = {
  createdAt?: string;
  date?: string;
  amount?: number;
  total?: number;
  orderNumber?: string;
  saleNumber?: string;
  description?: string;
  items?: SaleItem[];
  customer?: CustomerData;
  billingCustomer?: CustomerData;
  device?: ServiceOrder['device'];
  repair?: ServiceOrder['repair'];
};
export const STORE_INFO = {
  nombreLocal: "MECANICA CELULAR", // Reemplaza con el nombre de tu local
  direccion: "JOSE GUERRERO Y LIZARDO RUIZ, QUITO", // Reemplaza con tu dirección
  RUC: "0402083232001", // Reemplaza con tu RUC
  Telefono: "0998075071" // Reemplaza con tu teléfono
};

export const printReceipt = (
  order: OrderForNotaVenta | OrderForTicket,
  format: string,
  docType: 'ticket' | 'nota-venta' = 'ticket'
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para imprimir.');
    return;
  }

  // Type narrowing for common properties and safe access
  const orderData: PrintableOrderData = order;
  const date = new Date(orderData.createdAt || orderData.date || new Date()).toLocaleDateString();
  const time = new Date(orderData.createdAt || orderData.date || new Date()).toLocaleTimeString([], { hour12: false });
  const logoPath = './Logo.svg';

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
    
    const customerFullName = orderData.customer?.fullName || orderData.billingCustomer?.fullName || 'CONSUMIDOR FINAL';
    const customerDocumentId = orderData.customer?.documentId || orderData.billingCustomer?.documentId || '9999999999999';
    const customerAddress = orderData.customer?.address || orderData.billingCustomer?.address || 'SD';
    const numDoc = orderData.orderNumber || orderData.saleNumber || 'S/N';

    const isThermal = format === '58mm' || format === '80mm';
    const width = format === '80mm' ? '80mm' : (format === '58mm' ? '58mm' : '210mm');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nota de Venta - ${numDoc}</title>
          <style>
            @page { margin: ${format === '58mm' ? '0mm' : '5mm'}; size: ${isThermal ? width + ' auto' : 'A4'}; }
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              width: ${isThermal ? width : 'auto'}; 
              margin: 0 auto; 
              padding: ${format === '58mm' ? '1mm' : '10mm'}; 
              color: #000; 
              font-size: ${format === '58mm' ? '7.5pt' : (format === '80mm' ? '9.5pt' : '11pt')}; 
              line-height: 1.1;
            }
            .header { text-align: center; margin-bottom: 10px; ${isThermal ? 'border-bottom: 1px dashed #000; padding-bottom: 5px;' : ''} }
            .header img { max-width: ${isThermal ? '50%' : '150px'}; margin-bottom: 5px; }
            .header h1 { margin: 0; font-size: ${isThermal ? '14pt' : '18pt'}; text-transform: uppercase; }
            
            .doc-info { margin-bottom: 10px; display: flex; justify-content: space-between; }
            .doc-info p { margin: 2px 0; font-weight: bold; }

            .client-info { margin-bottom: 10px; border: 1px solid #000; padding: 5px; border-radius: 4px; }
            .client-info p { margin: 2px 0; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { border: 1px solid #000; padding: 4px; text-align: left; }
            th { background-color: #f0f0f0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .totals { width: 100%; display: flex; flex-direction: column; align-items: flex-end; }
            .totals-table { width: ${isThermal ? '100%' : '200px'}; border-top: 1px solid #000; }
            .totals-table td { border: none; padding: 2px 4px; }

            .signatures { margin-top: 30px; display: flex; justify-content: space-around; width: 100%; }
            .signature-box { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 9pt; }

            @media print {
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoPath}" alt="Logo" onerror="this.style.display='none'"/>
            <h1>${STORE_INFO.nombreLocal}</h1>
            <p>${STORE_INFO.direccion}</p>
            <p>RUC: ${STORE_INFO.RUC} | Telf: ${STORE_INFO.Telefono}</p>
            <h2 style="margin: 10px 0; font-size: ${isThermal ? '12pt' : '14pt'}; border-top: 1px dashed #000; padding-top: 5px;">NOTA DE VENTA N° ${numDoc}</h2>
          </div>

          <div class="doc-info">
             <p>Fecha: ${date} ${time}</p>
          </div>

          <div class="client-info">
            <p><strong>Cliente:</strong> ${customerFullName}</p>
            <p><strong>RUC/CI:</strong> ${customerDocumentId}</p>
            <p><strong>Dirección:</strong> ${customerAddress}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center">Cant</th>
                <th>Descripción</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td class="text-center">${item.quantity}</td>
                  <td>${item.description}</td>
                  <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td><strong>TOTAL A PAGAR:</strong></td>
                <td class="text-right"><strong>$${totalAmount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          ${!isThermal ? `
          <div class="signatures">
            <div class="signature-box">Entregué Conforme</div>
            <div class="signature-box">Recibí Conforme</div>
          </div>
          ` : ''}

          <div style="margin-top: 20px; text-align: center; font-size: 8pt;">
             <p>Gracias por su compra</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
  } else {
    // Ticket de Ingreso
    const totalCost = Number(orderData.repair?.repairTotalCost) || 0;
    const abono = Number(orderData.repair?.initialDeposit) || 0;
    const saldo = totalCost - abono;

    if (format === 'A4') {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ticket A4 - ${orderData.orderNumber}</title>
            <style>
              @page { margin: 8mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 5px; color: #000; font-size: 11px; line-height: 1.3; }
              .header-container { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header-left { width: 50%; }
              .header-left img { max-width: 140px; margin-bottom: 3px; }
              .header-left h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
              .header-left p { margin: 1px 0; font-size: 11px; }
              .header-right { width: 45%; border: 2px solid #000; padding: 8px; border-radius: 8px; text-align: center; }
              .header-right h1 { margin: 0 0 3px 0; font-size: 18px; background-color: #f0f0f0; padding: 3px; border-radius: 4px; }
              .header-right p { margin: 3px 0; font-size: 12px; font-weight: bold; }
              
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
              .info-box { border: 1px solid #000; padding: 8px; border-radius: 8px; }
              .info-box h3 { margin-top: 0; background-color: #f0f0f0; padding: 3px; margin-bottom: 8px; text-align: center; font-size: 12px; }
              .info-box p { margin: 3px 0; }
              .strong { font-weight: bold; }
              
              .finances { border: 2px solid #000; padding: 8px; margin-top: 10px; border-radius: 8px; font-size: 14px; font-weight: bold; text-align: center; background-color: #f9f9f9; }
              
              .terms-container { display: flex; margin-top: 15px; gap: 10px; }
              .terms { width: 60%; font-size: 9px; text-align: justify; padding: 8px; background-color: #f8f8f8; border-radius: 8px; border: 1px dashed #ccc; line-height: 1.2; }
              .signatures { width: 40%; display: flex; flex-direction: column; justify-content: space-around; }
              .signature-box { text-align: center; margin-top: 15px; }
              .signature-line { border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 3px; font-weight: bold; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="header-container">
              <div class="header-left">
                <img src="${logoPath}" alt="Logo" onerror="this.style.display='none'"/>
                <p><strong>${STORE_INFO.nombreLocal}</strong></p>
                <p>Dirección: ${STORE_INFO.direccion}</p>
                <p>RUC: ${STORE_INFO.RUC}</p>
                <p>Telf: ${STORE_INFO.Telefono}</p>
              </div>
              <div class="header-right">
                <h1>TICKET DE INGRESO</h1>
                <p>ORDEN N° ${orderData.orderNumber}</p>
                <p>FECHA: ${date} ${time}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-box">
                <h3>DATOS DEL CLIENTE</h3>
                <p><span class="strong">Nombres:</span> ${orderData.customer?.fullName}</p>
                <p><span class="strong">CI/RUC:</span> ${orderData.customer?.documentId}</p>
                <p><span class="strong">Teléfono:</span> ${orderData.customer?.phone}</p>
              </div>
              <div class="info-box">
                <h3>DETALLE DEL EQUIPO</h3>
                <p><span class="strong">Marca:</span> ${orderData.device?.brand}</p>
                <p><span class="strong">Modelo:</span> ${orderData.device?.model}</p>
                <p><span class="strong">IMEI/SN:</span> ${orderData.device?.serialNumber}</p>
              </div>
            </div>

            <div class="info-box" style="margin-bottom: 10px;">
              <p class="strong">ESTADO PREVIO DEL EQUIPO:</p>
              <p>${orderData.device?.physicalCondition}</p>
            </div>
            
            <div class="info-box">
              <p class="strong">TRABAJO A REALIZAR:</p>
              <p>${orderData.repair?.reportedIssue}</p>
            </div>

            <div class="finances">
              TOTAL: $${totalCost.toFixed(2)} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; ABONO: $${abono.toFixed(2)} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; SALDO: $${saldo.toFixed(2)}
            </div>

            <div class="terms-container">
              <div class="terms">
                <strong>TÉRMINOS Y CONDICIONES DE SERVICIO:</strong><br/><br/>
                1. Después de 30 días los equipos pueden ser usados como remate o refacción sin responsabilidad de parte nuestra.<br/>
                2. Retire chip y memoria, no nos hacemos responsables de tales pérdidas.<br/>
                3. En equipos mojados, software, daños por mal uso e intervenidos no hay garantía.<br/>
                4. Si requiere más tiempo solicite una nota con fecha nueva.<br/>
                5. La entrega del equipo será solo con esta nota o identificación personal correspondiente.<br/>
                6. Los reemplazos de piezas cuentan con 30 días de garantía contra defectos de fábrica. No hay garantía si el equipo presenta daño por golpe, humedad o mal uso.
              </div>
              <div class="signatures">
                <div class="signature-box">
                  <br/><br/>
                  <div class="signature-line">Firma Cliente</div>
                </div>
                <div class="signature-box">
                  <br/><br/>
                  <div class="signature-line">Firma Técnico Autorizado</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(html);
    } else {
      // Ticket Térmico de Ingreso
      const width = format === '80mm' ? '80mm' : '58mm';
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket - ${orderData.orderNumber}</title>
          <style>
            @page { margin: 5mm; }
            body { font-family: 'Helvetica Neue', Helvetica, monospace; width: ${width}; margin: 0 auto; padding: 0; font-size: 11px; color: #000; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .header img { max-width: 60%; margin-bottom: 5px; }
            .header h1 { margin: 0; font-size: 16px; text-transform: uppercase; font-weight: bold; }
            .header p { margin: 2px 0; font-size: 10px; }
            .section { margin-bottom: 10px; }
            .section p { margin: 2px 0; }
            .strong { font-weight: bold; }
            .finanzas { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin: 10px 0; font-size: 12px; font-weight: bold; text-align: center; }
            .terminos { font-size: 9px; line-height: 1.2; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; text-align: justify; }
            .footer { text-align: center; margin-top: 10px; font-weight: bold; font-size: 12px; }
            .flex-row { display: flex; justify-content: space-between; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoPath}" alt="Logo" onerror="this.style.display='none'"/>
            <p class="strong">${STORE_INFO.nombreLocal}</p>
            <p>DIR: ${STORE_INFO.direccion}</p>
            <p>RUC: ${STORE_INFO.RUC}</p>
          </div>

          <div class="section">
            <p class="flex-row"><span class="strong">ORDEN:</span> <span>#${orderData.orderNumber}</span></p>
            <p class="flex-row"><span class="strong">FECHA:</span> <span>${date} ${time}</span></p>
          </div>

          <div class="section">
            <p class="strong">--- DATOS DEL CLIENTE ---</p>
            <p>NOMBRE: ${orderData.customer?.fullName}</p>
            <p>CI/RUC: ${orderData.customer?.documentId}</p>
            <p>TELÉFONO: ${orderData.customer?.phone}</p>
          </div>

          <div class="section">
            <p class="strong">--- DETALLE DEL EQUIPO ---</p>
            <p>MARCA: ${orderData.device?.brand}</p>
            <p>MODELO: ${orderData.device?.model}</p>
            <p>IMEI/SN: ${orderData.device?.serialNumber}</p>
            <p class="strong mt-2">ESTADO PREVIO:</p>
            <p>${orderData.device?.physicalCondition}</p>
            <p class="strong mt-2">TRABAJO A REALIZAR:</p>
            <p>${orderData.repair?.reportedIssue}</p>
          </div>

          <div class="finanzas">
            TOTAL: $${totalCost.toFixed(2)} - ABONO: $${abono.toFixed(2)} = SALDO: $${saldo.toFixed(2)}
          </div>

          <div class="terminos">
            <strong>Términos y condiciones:</strong><br/>
            Agradecemos su confianza y hacemos de su conocimiento las siguientes condiciones de servicio:<br/>
            - Después de 30 días los equipos pueden ser usados como remate o refacción sin responsabilidad de parte nuestra.<br/>
            - Retire chip y memoria, no nos hacemos responsables de tales pérdidas.<br/>
            - En equipos mojados, software, daños por mal uso e intervenidos no hay garantía.<br/>
            - Si requiere más tiempo solicite una nota con fecha nueva.<br/>
            - La entrega del equipo será solo con nota o identificación.<br/>
            - Los reemplazos de piezas cuentan con 30 días de garantía contra defectos de fábrica. No aplica garantía si el equipo presenta daño por golpe, humedad o mal uso.<br/>
          </div>

          <div class="footer">
            <p>${STORE_INFO.nombreLocal}</p>
            <p>WhatsApp: ${STORE_INFO.Telefono}</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    }
  }

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
