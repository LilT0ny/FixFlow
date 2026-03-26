export interface CustomerData {
  fullName: string;
  documentId: string; // Cédula
  phone: string;
  email?: string;
  address?: string;
}

export interface DeviceData {
  brand: string;
  model: string;
  serialNumber: string; // IMEI/Serial
  deviceType: 'celular' | 'impresora' | 'tablet' | 'laptop' | 'otro' | '';
  physicalCondition: string;
}

export interface EvidencePhoto {
  stage: 'antes' | 'durante' | 'despues';
  url: string;
}

export interface RepairDetails {
  reportedIssue: string;
  evidencePhotos: EvidencePhoto[]; // Handling photo categorization
  initialDeposit?: number | ''; // Empty string allows for empty form inputs
  repairTotalCost?: number | ''; // New field for agreed total cost
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
  billingCustomer?: CustomerData;
  device: DeviceData;
  repair: RepairDetails;
  status: OrderStatus;
  createdAt: string;
  deleted?: boolean;
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';
export type PaymentType = 'reparacion' | 'repuestos' | 'arriendo' | 'servicios' | 'insumos' | 'otro';
export type TransactionType = 'ingreso' | 'egreso';

export interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  transactionType: TransactionType;
  description: string;
  orderId?: string; // Optional if it's just a general part sale without an order
  customer?: CustomerData; // For manual sales
  billingCustomer?: CustomerData;
  items?: SaleItem[]; // For manual sales with multiple items
  saleNumber?: string;
}

export type PrinterType = '58mm' | '80mm' | 'A4';

export interface BusinessSettings {
  companyName: string;
  logo: string;
  whatsappTemplate: string;
  printerType: PrinterType;
  phone: string;
  address: string;
  ruc: string;
}

