export interface DocumentConfig {
  companyName: string;
  logoUrl: string;
  type: 'RECEIPT' | 'WAYBILL';
  items: { description: string; quantity: number; price?: number }[];
  origin: string;
  destination: string;
  trackingNumber: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
}