/**
 * Represents the status of a shipment at any given time.
 */
export type WaybillStatus = 'Pending' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';

/**
 * Basic contact information for parties involved in the shipment.
 */
interface ContactInfo {
  name: string;
  phoneNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Individual item entries within the shipment.
 */
interface ShipmentItem {
  description: string;
  quantity: number;
  weightKg: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  value?: number;
  currency?: string;
}

/**
 * The primary Waybill structure.
 */
export interface Waybill {
  waybillNumber: string; // Unique tracking identifier
  orderReference?: string; // Internal order ID or SKU
  createdDate: string; // ISO 8601 format
  status: WaybillStatus;
  
  sender: ContactInfo;
  receiver: ContactInfo;
  
  items: ShipmentItem[];
  
  totalWeight: number;
  totalVolume?: number;
  shippingService: 'Standard' | 'Express' | 'Overnight';
  
  notes?: string;
  requiresSignature: boolean;
}

// New comprehensive waybill form data interface
export interface WaybillFormData {
  // 1. From (Sender)
  senderAccountNo: string;
  senderName: string;
  senderAddress: string;
  
  // 2. To (Receiver)
  receiverName: string;
  receiverAddress: string;
  receiverTelephone: string; // +63 country code for Philippines
  
  // 3. Shipment Specs
  pieces: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  contents: string; // defaults to 'Personal Effects'
  
  // 4. Financials
  insurance: number;
  airportTaxVat: number;
  destinationDuty: number;
  baseFreight: number;
  currencyTotal: number; // Auto-calculated
  
  // 5. Service Type
  serviceType: {
    diplomaticCourier: boolean;
    domestic: boolean;
    worldMail: boolean;
    repairReturn: boolean;
  };
  
  // 6. Dates
  departureDate: string;
  arrivalDate: string;
  
  // 7. Signatures
  senderSignatureUrl: string;
  officialStampUrl: string;
  
  // System generated
  consignmentNumber: string; // SKY-2026-XXXX format
  createdAt: string;
}

export interface DocumentConfig {
  companyName: string;
  logoUrl: string;
  type: 'RECEIPT' | 'WAYBILL';
  items: { description: string; quantity: number; price?: number }[];
  origin: string;
  destination: string;
  trackingNumber: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  // New professional fields
  receiptNumber?: string;
  dateOfIssue?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'POS' | 'Credit Card';
  currency?: 'USD' | 'EUR' | 'GBP' | 'NGN' | 'KES' | 'GHS';
  signatureUrl?: string;
  applyStamp?: boolean;
  notes?: string;
  companyAddress?: string;
  companyPhone?: string;
  customerName?: string;
  customerAddress?: string;
  taxRate?: number;
  description?: string; // NEW: Receipt description/memo
  transferMode?: string; // NEW: Mode of transfer (e.g., Bank Transfer - Wire)
  receiptDescription?: string; // NEW: Detailed receipt description
  // Waybill specific data
  waybillData?: WaybillFormData;
}
