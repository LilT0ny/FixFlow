import type { ServiceOrder, DeviceCheckInForm } from '../types';

export const printReceipt = (
  order: ServiceOrder | (DeviceCheckInForm & { orderNumber: string; createdAt: string }),
  format: string
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para imprimir.');
    return;
  }

  const date = new Date(order.createdAt).toLocaleDateString();
  const time = new Date(order.createdAt).toLocaleTimeString([], { hour12: false });
  const logoPath = '/Logo.svg';

  // For Nota de Venta (A4 format usually implies Nota de Venta)
  if (format === 'A4') {
    const totalCost = Number(order.repair.repairTotalCost) || 0;
    
    // Nota de Venta Layout
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nota de Venta - ${order.orderNumber}</title>
          <style>
            @page { margin: 15mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #000; font-size: 14px; }
            .header-container { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .header-left { width: 50%; }
            .header-left img { max-width: 150px; margin-bottom: 10px; }
            .header-left h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
            .header-left p { margin: 2px 0; font-size: 12px; }
            .header-right { width: 45%; border: 2px solid #000; padding: 10px; border-radius: 8px; }
            .header-right h1 { margin: 0 0 10px 0; font-size: 22px; text-align: center; background-color: #f0f0f0; padding: 5px; border-radius: 4px; }
            .header-right p { margin: 4px 0; font-size: 14px; font-weight: bold; }
            
            .customer-info { margin-bottom: 20px; border: 1px solid #000; padding: 10px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .customer-info p { margin: 2px 0; font-size: 13px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f0f0f0; text-align: center; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .footer-container { display: flex; justify-content: space-between; }
            .payment-info { width: 50%; padding-top: 10px; }
            .payment-info p { margin: 4px 0; font-size: 13px; }
            .totals { width: 45%; }
            .totals table { width: 100%; border-collapse: collapse; }
            .totals th, .totals td { padding: 4px 8px; border: 1px solid #000; }
            .totals td.val { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-left">
              <img src="${logoPath}" alt="Logo" onerror="this.style.display='none'"/>
              <h2>MANGUA PUETATE YAHAHIRA ALEXANDRA</h2>
              <p>MECANICA CELULAR</p>
              <p>Dirección: JOSE GUERRERO Y LIZARDO RUIZ, QUITO</p>
              <p>Telf: 0998075071</p>
            </div>
            <div class="header-right">
              <h1>NOTA DE VENTA</h1>
              <p>N° ${order.orderNumber.padStart(9, '0')}</p>
              <p>Fecha de Emisión: ${date} ${time}</p>
            </div>
          </div>

          <div class="customer-info">
            <div>
              <p><strong>Razón Social/Nombres:</strong> ${order.customer.fullName || 'CONSUMIDOR FINAL'}</p>
              <p><strong>RUC/CI:</strong> ${order.customer.documentId || '9999999999999'}</p>
              <p><strong>Dirección:</strong> SD</p>
            </div>
            <div>
              <p><strong>Guía de Remisión:</strong> None</p>
              <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
              <p><strong>Correo Electrónico:</strong> SD</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cod. Principal</th>
                <th>Cant.</th>
                <th>Descripción</th>
                <th>P. Unit</th>
                <th>Desc.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center">REP-001</td>
                <td class="text-center">1</td>
                <td>Reparación de: ${order.device.brand} ${order.device.model} - ${order.repair.reportedIssue}</td>
                <td class="text-right">$${totalCost.toFixed(2)}</td>
                <td class="text-right">$0.00</td>
                <td class="text-right">$${totalCost.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-container">
            <div class="payment-info">
              <p><strong>MÉTODO DE PAGO:</strong>
              <br/>EFECTIVO: $${totalCost.toFixed(2)}</p>
            </div>
            <div class="totals">
              <table>
                <tr><td>SUBTOTAL 15%</td><td class="val">$0.00</td></tr>
                <tr><td>SUBTOTAL 0%</td><td class="val">$${totalCost.toFixed(2)}</td></tr>
                <tr><td>SUBTOTAL No objeto de IVA</td><td class="val">$0.00</td></tr>
                <tr><td>SUBTOTAL Exento de IVA</td><td class="val">$0.00</td></tr>
                <tr><td>SUBTOTAL SIN IMPUESTOS</td><td class="val">$${totalCost.toFixed(2)}</td></tr>
                <tr><td>DESCUENTO</td><td class="val">$0.00</td></tr>
                <tr><td><strong>IVA 15%</strong></td><td class="val"><strong>$0.00</strong></td></tr>
                <tr><td><strong>VALOR TOTAL</strong></td><td class="val"><strong>$${totalCost.toFixed(2)}</strong></td></tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
  } else {
    // Ticket Térmico de Ingreso
    const width = format === '80mm' ? '80mm' : '58mm';
    const totalCost = Number(order.repair.repairTotalCost) || 0;
    const abono = Number(order.repair.initialDeposit) || 0;
    const saldo = totalCost - abono;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket - ${order.orderNumber}</title>
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
            <h1>MECÁNICA CELULAR</h1>
            <p>MANGUA PUETATE YAHAHIRA ALEXANDRA</p>
            <p>DIR: JOSE GUERRERO Y LIZARDO RUIZ, QUITO</p>
            <p>TELF: 0998075071</p>
          </div>

          <div class="section">
            <p class="flex-row"><span class="strong">ORDEN:</span> <span>#${order.orderNumber}</span></p>
            <p class="flex-row"><span class="strong">FECHA:</span> <span>${date} ${time}</span></p>
          </div>

          <div class="section">
            <p class="strong">--- DATOS DEL CLIENTE ---</p>
            <p>NOMBRE: ${order.customer.fullName}</p>
            <p>CI/RUC: ${order.customer.documentId}</p>
            <p>TELÉFONO: ${order.customer.phone}</p>
          </div>

          <div class="section">
            <p class="strong">--- DETALLE DEL EQUIPO ---</p>
            <p>MARCA: ${order.device.brand}</p>
            <p>MODELO: ${order.device.model}</p>
            <p>IMEI/SN: ${order.device.serialNumber}</p>
            <p class="strong mt-2">ESTADO PREVIO:</p>
            <p>${order.device.physicalCondition}</p>
            <p class="strong mt-2">TRABAJO A REALIZAR:</p>
            <p>${order.repair.reportedIssue}</p>
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
            - Los reemplazos de piezas cuentan con 30 días de garantía contra defectos de fábrica. No aplica garantía si el equipo presenta daño por golpe, humedad o mal uso. Pueden existir variaciones entre la pieza original y el reemplazo como logos, tonalidad de color, material, etc.<br/>
            - Los tiempos para liberación por código y vía servidor son establecidos por proveedores terceros, en raras ocasiones pueden retrasarse. No habrá reembolso hasta completada la orden. La liberación de compañía no elimina el reporte de robo o extravió.<br/>
            - El tiempo de entrega puede retrasarse cuando la refacción viene de proveedores externos.
          </div>

          <div class="footer">
            <p>WhatsApp: 0998075071</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
  }

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
