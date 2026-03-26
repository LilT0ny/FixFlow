import React from 'react';
import type { ServiceOrder } from '../../types';

interface PrintableReceiptProps {
  order: ServiceOrder;
}

/**
 * PrintableReceipt (Organism)
 * Componente optimizado para impresión de recibos.
 * Cumple con formato de Mayúsculas y layout para media print.
 */
export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ order }) => {
  const formatUppercase = (str?: string) => (str ? str.toUpperCase() : '');
  const formatLowercase = (str?: string) => (str ? str.toLowerCase() : '');

  const date = new Date(order.createdAt).toLocaleDateString();
  const time = new Date(order.createdAt).toLocaleTimeString([], { hour12: false });

  // Cálculos Básicos
  const total = Number(order.repair.repairTotalCost) || 0;
  const abono = Number(order.repair.initialDeposit) || 0;
  const saldo = total - abono;

  return (
    <div className="printable-receipt">
      {/* Header */}
      <div className="grid-2 mb-4 hp-2-black">
        <div>
          <h1 className="uppercase text-2xl mb-2">SISTEMA DE REPARACIONES</h1>
          <p className="mb-2 uppercase">DIRECCIÓN: LOCAL PRINCIPAL</p>
          <p className="mb-2 uppercase">TELÉFONO: S/N</p>
        </div>
        <div className="border-box text-center bg-gray">
          <h2 className="uppercase text-xl mb-2">RECIBO DE INGRESO</h2>
          <p className="mb-2 bold text-lg">ORDEN N° {formatUppercase(order.orderNumber)}</p>
          <p className="mb-2 bold">FECHA: {date} {time}</p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid-2 mb-4">
        <div className="border-box">
          <h3 className="bg-gray text-center uppercase mb-4 p-5-neg rounded-t-lg border-b-2-black">DATOS DEL CLIENTE</h3>
          <p className="mb-2"><span className="bold uppercase">NOMBRES:</span> {formatUppercase(order.customer.fullName)}</p>
          <p className="mb-2"><span className="bold uppercase">CÉDULA/RUC:</span> {formatUppercase(order.customer.documentId)}</p>
          <p className="mb-2"><span className="bold uppercase">TELÉFONO:</span> {formatUppercase(order.customer.phone)}</p>
          <p className="mb-2"><span className="bold uppercase">EMAIL:</span> {formatLowercase(order.customer.email)}</p>
        </div>
        
        <div className="border-box">
          <h3 className="bg-gray text-center uppercase mb-4 p-5-neg rounded-t-lg border-b-2-black">DETALLES DEL DISPOSITIVO</h3>
          <p className="mb-2"><span className="bold uppercase">TIPO:</span> {formatUppercase(order.device.deviceType)}</p>
          <p className="mb-2"><span className="bold uppercase">MARCA:</span> {formatUppercase(order.device.brand)}</p>
          <p className="mb-2"><span className="bold uppercase">MODELO:</span> {formatUppercase(order.device.model)}</p>
          <p className="mb-2"><span className="bold uppercase">IMEI/SN:</span> {formatUppercase(order.device.serialNumber)}</p>
        </div>
      </div>

      {/* Trabajo y Costos */}
      <div className="border-box mb-4">
        <p className="mb-2 bold uppercase">ESTADO PREVIO DEL EQUIPO:</p>
        <p className="mb-4 uppercase p-left-10">{formatUppercase(order.device.physicalCondition)}</p>

        <p className="mb-2 bold uppercase">TRABAJO A REALIZAR:</p>
        <p className="uppercase p-left-10">{formatUppercase(order.repair.reportedIssue)}</p>
      </div>

      <div className="border-box mb-4 bg-gray text-center text-lg">
        <span className="bold uppercase">COSTO TOTAL:</span> ${total.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp;
        <span className="bold uppercase">ABONO:</span> ${abono.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp;
        <span className="bold uppercase">SALDO:</span> ${saldo.toFixed(2)}
      </div>

      {/* Firma */}
      <div className="grid-2 mt-60">
        <div className="text-center">
          <div className="border-t-2-black w-80-auto pt-2 bold uppercase">FIRMA CLIENTE</div>
        </div>
        <div className="text-center">
          <div className="border-t-2-black w-80-auto pt-2 bold uppercase">FIRMA TÉCNICO</div>
        </div>
      </div>
    </div>
  );
};
