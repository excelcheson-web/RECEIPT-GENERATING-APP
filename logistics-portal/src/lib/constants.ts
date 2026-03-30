export const GREENHILLS_CONFIG = {
  name: 'Greenhills Chemicals Incorporated',
  logo: 'https://placeholder.com/logo-greenhills.png',
  phone: '+639625021374',
  address: 'Greenhills Product Bldg, M.L Quezon St. Casuntingan, Mandaue City, Cebu'
} as const

export const SKYSHIP_CONFIG = {
  name: 'Skyship Logistics',
  logo: '/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png',
  phone: '+44 7935 244329',
  address: 'GOLDEN CROSS HOUSE, 456-458 STRAND, London, United Kingdom',
  iataCode: 'SKY-12345',
  agentCode: 'SKY-AGENT-001',
  carrierCode: 'SKY'
} as const

// Keep old name for backward compatibility
export const SKYDEX_CONFIG = SKYSHIP_CONFIG

// Company contact information for use across all pages
export const COMPANY_CONTACT = {
  phone: '+44 7935 244329',
  address: 'GOLDEN CROSS HOUSE, 456-458 STRAND',
  email: 'contact@skyshiplogistics.com'
} as const

// Smart Defaults - Auto-filled logistics data
export const SMART_DEFAULTS = {
  // Airport/City Codes
  airportOfDeparture: 'LAGOS',
  airportOfDepartureCode: 'LOS',
  defaultDestination: 'LONDON',
  defaultDestinationCode: 'LHR',
  
  // IATA and Agent Information
  iataCode: 'SKY-12345',
  agentName: 'Skyship Logistics',
  agentCity: 'Lagos',
  
  // Carrier Information
  issuingCarrier: 'Skyship Logistics',
  carrierReference: 'SKY-REF-AUTO',
  
  // Terms and Conditions
  termsAndConditions: `Note: Received in apparent good order unless otherwise noted. Subject to the terms and conditions of the Carrier's Service Guide. Liability is limited as per the back of this document or applicable law. All claims for loss or damage must be filed within 14 days.`,
  
  // Handling Information
  defaultHandlingInfo: 'Handle with care. Fragile items - do not drop.',
  
  // Service Defaults
  defaultServiceType: 'Prepaid',
  defaultTransportMode: 'AIR' as const,
  
  // Currency
  defaultCurrency: 'USD',
  
  // Status
  defaultStatus: 'PENDING' as const
} as const

// Transport mode configurations for tracking
export const TRANSPORT_CONFIG = {
  AIR: {
    name: 'Air Freight',
    prefix: 'SKY-AWB',
    avgSpeedKmh: 900,
    baseTransitDays: 3,
    trackingPrefix: 'AWB'
  },
  SEA: {
    name: 'Sea Freight',
    prefix: 'SKY-SWB',
    avgSpeedKmh: 40,
    baseTransitDays: 21,
    trackingPrefix: 'SWB'
  },
  LAND: {
    name: 'Land Transport',
    prefix: 'SKY-LWB',
    avgSpeedKmh: 80,
    baseTransitDays: 7,
    trackingPrefix: 'LWB'
  },
  DOOR_TO_DOOR: {
    name: 'Door to Door',
    prefix: 'SKY-DTD',
    avgSpeedKmh: 60,
    baseTransitDays: 5,
    trackingPrefix: 'DTD'
  }
} as const

// Generate waybill number based on transport mode with timestamp
export function generateWaybillNumber(mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR' = 'AIR'): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.floor(100 + Math.random() * 900)
  const prefix = TRANSPORT_CONFIG[mode].prefix
  return `${prefix}-${year}-${timestamp}${random}`
}

// Generate tracking ID that works with tracking app
export function generateTrackingId(mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR' = 'AIR'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let random = ''
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const year = new Date().getFullYear()
  const prefix = TRANSPORT_CONFIG[mode].trackingPrefix
  return `SKY-${prefix}-${random}-${year}`
}

// Calculate estimated delivery date based on transport mode and destination
export function calculateEstimatedDelivery(
  departureDate: string, 
  mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR',
  destination?: string
): Date {
  const departure = new Date(departureDate)
  const baseDays = TRANSPORT_CONFIG[mode].baseTransitDays
  
  // Add extra days for certain destinations (simplified logic)
  let extraDays = 0
  if (destination) {
    const dest = destination.toLowerCase()
    // Remote destinations
    if (dest.includes('australia') || dest.includes('new zealand')) extraDays = 2
    if (dest.includes('remote') || dest.includes('rural')) extraDays = 3
  }
  
  const estimated = new Date(departure)
  estimated.setDate(estimated.getDate() + baseDays + extraDays)
  return estimated
}

// Format date for waybill display
export function formatWaybillDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

// Get current timestamp for waybill generation
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Airlines for AIR transport (randomly selected)
export const AIRLINES = [
  'Emirates SkyCargo',
  'Lufthansa Cargo',
  'Air France-KLM Martinair',
  'Cathay Pacific Cargo',
  'Korean Air Cargo',
  'Turkish Cargo',
  'Qatar Airways Cargo',
  'Etihad Cargo',
  'Singapore Airlines Cargo',
  'British Airways World Cargo'
] as const

// Shipping companies for SEA transport (randomly selected)
export const SHIPPING_COMPANIES = [
  'Maersk Line',
  'MSC (Mediterranean Shipping)',
  'CMA CGM',
  'Hapag-Lloyd',
  'Evergreen Marine',
  'COSCO Shipping',
  'ONE (Ocean Network Express)',
  'HMM (Hyundai Merchant Marine)',
  'Yang Ming Marine',
  'PIL (Pacific International Line)'
] as const

// Countries list for dropdowns - Asian, North/South American, European countries
export const COUNTRIES = [
  // Asian Countries
  { code: 'CN', name: 'China', city: 'Shanghai', airport: 'PVG' },
  { code: 'JP', name: 'Japan', city: 'Tokyo', airport: 'NRT' },
  { code: 'KR', name: 'South Korea', city: 'Seoul', airport: 'ICN' },
  { code: 'SG', name: 'Singapore', city: 'Singapore', airport: 'SIN' },
  { code: 'TH', name: 'Thailand', city: 'Bangkok', airport: 'BKK' },
  { code: 'MY', name: 'Malaysia', city: 'Kuala Lumpur', airport: 'KUL' },
  { code: 'ID', name: 'Indonesia', city: 'Jakarta', airport: 'CGK' },
  { code: 'PH', name: 'Philippines', city: 'Manila', airport: 'MNL' },
  { code: 'VN', name: 'Vietnam', city: 'Ho Chi Minh City', airport: 'SGN' },
  { code: 'IN', name: 'India', city: 'Mumbai', airport: 'BOM' },
  { code: 'AE', name: 'UAE', city: 'Dubai', airport: 'DXB' },
  { code: 'SA', name: 'Saudi Arabia', city: 'Riyadh', airport: 'RUH' },
  { code: 'TW', name: 'Taiwan', city: 'Taipei', airport: 'TPE' },
  { code: 'HK', name: 'Hong Kong', city: 'Hong Kong', airport: 'HKG' },
  
  // North American Countries
  { code: 'US', name: 'United States', city: 'New York', airport: 'JFK' },
  { code: 'CA', name: 'Canada', city: 'Toronto', airport: 'YYZ' },
  { code: 'MX', name: 'Mexico', city: 'Mexico City', airport: 'MEX' },
  
  // South American Countries
  { code: 'BR', name: 'Brazil', city: 'Sao Paulo', airport: 'GRU' },
  { code: 'AR', name: 'Argentina', city: 'Buenos Aires', airport: 'EZE' },
  { code: 'CL', name: 'Chile', city: 'Santiago', airport: 'SCL' },
  { code: 'CO', name: 'Colombia', city: 'Bogota', airport: 'BOG' },
  { code: 'PE', name: 'Peru', city: 'Lima', airport: 'LIM' },
  { code: 'VE', name: 'Venezuela', city: 'Caracas', airport: 'CCS' },
  
  // European Countries
  { code: 'GB', name: 'United Kingdom', city: 'London', airport: 'LHR' },
  { code: 'DE', name: 'Germany', city: 'Frankfurt', airport: 'FRA' },
  { code: 'FR', name: 'France', city: 'Paris', airport: 'CDG' },
  { code: 'NL', name: 'Netherlands', city: 'Amsterdam', airport: 'AMS' },
  { code: 'IT', name: 'Italy', city: 'Milan', airport: 'MXP' },
  { code: 'ES', name: 'Spain', city: 'Madrid', airport: 'MAD' },
  { code: 'BE', name: 'Belgium', city: 'Brussels', airport: 'BRU' },
  { code: 'CH', name: 'Switzerland', city: 'Zurich', airport: 'ZRH' },
  { code: 'AT', name: 'Austria', city: 'Vienna', airport: 'VIE' },
  { code: 'SE', name: 'Sweden', city: 'Stockholm', airport: 'ARN' },
  { code: 'NO', name: 'Norway', city: 'Oslo', airport: 'OSL' },
  { code: 'DK', name: 'Denmark', city: 'Copenhagen', airport: 'CPH' },
  { code: 'FI', name: 'Finland', city: 'Helsinki', airport: 'HEL' },
  { code: 'PL', name: 'Poland', city: 'Warsaw', airport: 'WAW' },
  { code: 'CZ', name: 'Czech Republic', city: 'Prague', airport: 'PRG' },
  { code: 'HU', name: 'Hungary', city: 'Budapest', airport: 'BUD' },
  { code: 'PT', name: 'Portugal', city: 'Lisbon', airport: 'LIS' },
  { code: 'GR', name: 'Greece', city: 'Athens', airport: 'ATH' },
  { code: 'IE', name: 'Ireland', city: 'Dublin', airport: 'DUB' },
  { code: 'TR', name: 'Turkey', city: 'Istanbul', airport: 'IST' }
] as const

// Helper function to get random airline
export function getRandomAirline(): string {
  return AIRLINES[Math.floor(Math.random() * AIRLINES.length)]
}

// Helper function to get random shipping company
export function getRandomShippingCompany(): string {
  return SHIPPING_COMPANIES[Math.floor(Math.random() * SHIPPING_COMPANIES.length)]
}

// Helper function to get carrier display name based on transport mode
export function getCarrierDisplayName(transportMode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'): string {
  if (transportMode === 'AIR') {
    return `Skyship Logistics / ${getRandomAirline()}`
  } else if (transportMode === 'SEA') {
    return `Skyship Logistics / ${getRandomShippingCompany()}`
  } else {
    return 'Skyship Logistics'
  }
}
