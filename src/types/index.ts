export interface CustomerData {
  fullName: string;
  documentId: string; // Cédula
  phone: string;
}

export interface DeviceData {
  brand: string;
  model: string;
  serialNumber: string; // IMEI/Serial
  deviceType: 'celular' | 'impresora' | 'tablet' | 'laptop' | 'otro' | '';
  physicalCondition: string;
}

export interface RepairDetails {
  reportedIssue: string;
  evidencePhotos: string[]; // For UI preview simulation
  initialDeposit?: number | ''; // Empty string allows for empty form inputs
}

export interface DeviceCheckInForm {
  customer: CustomerData;
  device: DeviceData;
  repair: RepairDetails;
}

export type OrderStatus = 'recibido' | 'diagnostico' | 'esperando_repuestos' | 'listo' | 'entregado';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customer: CustomerData;
  device: DeviceData;
  repair: RepairDetails;
  status: OrderStatus;
  createdAt: string;
  deleted?: boolean;
}

export type PaymentMethod = 'efectivo' | 'transferencia';
export type PaymentType = 'reparacion' | 'repuestos' | 'arriendo' | 'servicios' | 'insumos' | 'otro';
export type TransactionType = 'ingreso' | 'egreso';

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  transactionType: TransactionType;
  description: string;
  orderId?: string; // Optional if it's just a general part sale without an order
}
