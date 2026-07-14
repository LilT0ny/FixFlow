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
  deviceType: 'celular' | 'impresora' | 'tablet' | 'laptop' | 'lavadora' | 'calefon' | 'refrigerador' | 'microondas' | 'tv' | 'cocina' | 'plancha' | 'licuadora' | 'otro' | '';
  physicalCondition: string;
}

export interface EvidencePhoto {
  stage: 'antes' | 'durante' | 'despues';
  url: string;
}

/** Repuesto del catálogo consumido por la orden (Inventario Fase 2) —
 *  solo lectura, inmutable una vez agregado. */
export interface RepuestoUsado {
  id: string;
  repuestoId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

export interface RepairDetails {
  reportedIssue: string;
  evidencePhotos: EvidencePhoto[]; // Handling photo categorization
  initialDeposit?: number | ''; // Empty string allows for empty form inputs
  repairTotalCost?: number | ''; // Mano de obra + repuestos ya sumados (ver OrderService.mapOrder)
  repuestosUsados?: RepuestoUsado[];
}

export interface DeviceCheckInForm {
  customer: CustomerData;
  device?: DeviceData;
  repair: RepairDetails;
  /** Repuestos a vincular al crear la orden (transitorio — solo para el
   *  payload de creación, no viene de mapOrder). Se puede seguir agregando
   *  después vía OrderService.addRepuestoUsado. */
  repuestos?: { repuestoId: string; cantidad: number; costoUnitario: number }[];
}

export type OrderStatus = 'recibido' | 'diagnostico' | 'esperando_repuestos' | 'listo' | 'entregado' | 'no_reparado';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customer: CustomerData;
  billingCustomer?: CustomerData;
  device?: DeviceData;
  repair: RepairDetails;
  status: OrderStatus;
  createdAt: string;
  deleted?: boolean;
  /** Nota de venta generada al entregar (si existe) */
  notaVenta?: { id: string; numero: string };
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';
export type PaymentType = 'reparacion' | 'repuestos' | 'arriendo' | 'servicios' | 'insumos' | 'otro';
export type TransactionType = 'ingreso' | 'egreso';

export interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  /** Repuesto del catálogo vinculado a este ítem (opcional — descuenta stock solo) */
  repuestoId?: string;
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
  termsConditions?: string;
}

