'use client'

import { useState, useCallback, useMemo } from 'react'
import { 
  SMART_DEFAULTS, 
  SKYSHIP_CONFIG, 
  generateWaybillNumber, 
  generateTrackingId,
  calculateEstimatedDelivery,
  formatWaybillDate,
  TRANSPORT_CONFIG 
} from '@/lib/constants'
import type { WaybillFormData, SmartDefaults, UserInputFields } from '@/lib/types'

// Initial user input state - ONLY fields user needs to fill
const initialUserInput: Partial<UserInputFields> & { logoUrl?: string } = {
  shipperName: '',
  shipperAddress: '',
  shipperPhone: '',
  consigneeName: '',
  consigneeAddress: '',
  consigneePhone: '',
  cargoDescription: '',
  contents: '',
  totalWeight: 0,
  totalPieces: 1,
  isFragile: false,
  isExpress: false,
  isDangerousGoods: false,
  lineItems: [{ description: '', pieces: 1, weight: 0, type: 'Box' }],
  specialInstructions: '',
  baseFreight: 0,
  insurance: 0,
  airportTaxVat: 0,
  destinationDuty: 0,
  receiverCity: '',
  routeNumber: '',
  logoUrl: '',
  // Routing fields - initialized empty, will be set by country dropdowns
  portOfDeparture: '',
  portOfDestination: '',
}

// Generate IATA code based on transport mode
function getIataCodeForMode(mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'): string {
  switch (mode) {
    case 'AIR':
      // Random airline code
      const airlineCodes = ['EK', 'LH', 'AF', 'CX', 'KE', 'TK', 'QR', 'EY', 'SQ', 'BA']
      return airlineCodes[Math.floor(Math.random() * airlineCodes.length)]
    case 'SEA':
      // Shipping company code
      const shippingCodes = ['MAEU', 'MSCU', 'CMAU', 'HLCU', 'EVER', 'COSU', 'ONEY', 'HMMU', 'PILU']
      return shippingCodes[Math.floor(Math.random() * shippingCodes.length)]
    case 'LAND':
      return 'TRUCK'
    case 'DOOR_TO_DOOR':
      return 'DTD'
    default:
      return 'SKY'
  }
}

// Generate carrier name based on transport mode
function getCarrierNameForMode(mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'): string {
  switch (mode) {
    case 'AIR':
      const airlines = ['Emirates', 'Lufthansa', 'Air France', 'Cathay Pacific', 'Korean Air', 'Turkish Airlines', 'Qatar Airways']
      return airlines[Math.floor(Math.random() * airlines.length)]
    case 'SEA':
      const shippers = ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd', 'Evergreen', 'COSCO']
      return shippers[Math.floor(Math.random() * shippers.length)]
    case 'LAND':
      return 'Land Transport Partner'
    case 'DOOR_TO_DOOR':
      return 'Door to Door Service'
    default:
      return 'Skyship Logistics'
  }
}

// Generate complete smart defaults based on transport mode
export function generateSmartDefaults(
  mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR' = 'AIR',
  destination?: string,
  departureCountry?: { code: string; name: string; city: string; airport: string },
  destinationCountry?: { code: string; name: string; city: string; airport: string }
): SmartDefaults {
  const now = new Date()
  const departureDate = formatWaybillDate(now)
  const estimatedArrival = calculateEstimatedDelivery(departureDate, mode, destination)
  
  // Use provided countries or defaults
  const departureCity = departureCountry?.city || SMART_DEFAULTS.airportOfDeparture
  const departureCode = departureCountry?.airport || SMART_DEFAULTS.airportOfDepartureCode
  const destinationCity = destinationCountry?.city || destination || SMART_DEFAULTS.defaultDestination
  const destinationCode = destinationCountry?.airport || (destination ? getAirportCode(destination) : SMART_DEFAULTS.defaultDestinationCode)
  
  return {
    // System Generated Identifiers
    waybillNumber: generateWaybillNumber(mode),
    trackingNumber: generateTrackingId(mode),
    consignmentNumber: `SKY-${Date.now().toString(36).toUpperCase()}`,
    
    // Auto-filled Dates
    dateOfIssue: departureDate,
    departureDate: departureDate,
    estimatedArrivalDate: formatWaybillDate(estimatedArrival),
    
    // Auto-filled Carrier Info - DYNAMIC based on transport mode
    issuingCarrier: `Skyship Logistics / ${getCarrierNameForMode(mode)}`,
    carrierReference: `${SKYSHIP_CONFIG.carrierCode}-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    iataCode: getIataCodeForMode(mode),
    agentName: SMART_DEFAULTS.agentName,
    agentCity: departureCity,
    
    // Auto-filled Location Info - DYNAMIC based on country selection
    airportOfDeparture: departureCity,
    airportOfDepartureCode: departureCode,
    airportOfDestination: destinationCity,
    airportOfDestinationCode: destinationCode,
    
    // Auto-filled Service Info
    serviceType: SMART_DEFAULTS.defaultServiceType,
    transportMode: mode,
    currency: SMART_DEFAULTS.defaultCurrency,
    
    // Auto-filled Terms
    termsAndConditions: SMART_DEFAULTS.termsAndConditions,
    handlingInformation: SMART_DEFAULTS.defaultHandlingInfo,
    
    // System Metadata
    createdAt: now.toISOString(),
    status: SMART_DEFAULTS.defaultStatus,
  }
}

// Helper to get airport code from destination name
function getAirportCode(destination: string): string {
  const codeMap: Record<string, string> = {
    'london': 'LHR',
    'new york': 'JFK',
    'los angeles': 'LAX',
    'dubai': 'DXB',
    'lagos': 'LOS',
    'abuja': 'ABV',
    'accra': 'ACC',
    'nairobi': 'NBO',
    'johannesburg': 'JNB',
    'paris': 'CDG',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'istanbul': 'IST',
    'doha': 'DOH',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'tokyo': 'NRT',
    'sydney': 'SYD',
  }
  
  const normalized = destination.toLowerCase().trim()
  return codeMap[normalized] || 'XXX'
}

// Hook for managing smart defaults
export function useSmartDefaults(
  mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR' = 'AIR',
  departureCountry?: { code: string; name: string; city: string; airport: string },
  destinationCountry?: { code: string; name: string; city: string; airport: string }
) {
  // Generate smart defaults on initialization with country info
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults>(() => 
    generateSmartDefaults(mode, undefined, departureCountry, destinationCountry)
  )
  
  // User input state - ONLY the fields user needs to fill
  const [userInput, setUserInput] = useState<Partial<UserInputFields> & { logoUrl?: string }>(initialUserInput)
  
  // Update transport mode and regenerate defaults
  const updateTransportMode = useCallback((newMode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR') => {
    setSmartDefaults(generateSmartDefaults(newMode, userInput.destinationOverride))
  }, [userInput.destinationOverride])
  
  // Update user input fields
  const updateUserInput = useCallback(<K extends keyof UserInputFields>(
    field: K, 
    value: UserInputFields[K]
  ) => {
    setUserInput(prev => ({ ...prev, [field]: value }))
    
    // If destination changes, update airport code
    if (field === 'destinationOverride' && typeof value === 'string') {
      setSmartDefaults(prev => ({
        ...prev,
        airportOfDestination: value,
        airportOfDestinationCode: getAirportCode(value),
        // Recalculate estimated arrival based on new destination
        estimatedArrivalDate: formatWaybillDate(
          calculateEstimatedDelivery(prev.departureDate, prev.transportMode, value)
        ),
      }))
    }
  }, [setUserInput, setSmartDefaults])
  
  // Regenerate waybill number (if user wants a new one)
  const regenerateWaybillNumber = useCallback(() => {
    setSmartDefaults(prev => ({
      ...prev,
      waybillNumber: generateWaybillNumber(prev.transportMode),
      trackingNumber: generateTrackingId(prev.transportMode),
    }))
  }, [])
  
  // Combine smart defaults with user input for complete form data
  const completeFormData: WaybillFormData = useMemo(() => {
    // Destructure to exclude serviceType string (we'll add legacy structure separately)
    const { serviceType, ...otherDefaults } = smartDefaults
    
    // Determine departure and destination - STRICTLY use user input only, no fallbacks to defaults
    // This ensures dashboard selections are the only source of truth
    const departure = userInput.portOfDeparture || ''
    const destination = userInput.portOfDestination || ''
    
    return {
      // Smart defaults (system generated) - excluding serviceType
      ...otherDefaults,
      
      // User input - Updated field names to match output
      shipperName: userInput.shipperName,
      shipperAddress: userInput.shipperAddress,
      shipperPhone: userInput.shipperPhone,
      consigneeName: userInput.consigneeName,
      consigneeAddress: userInput.consigneeAddress,
      consigneePhone: userInput.consigneePhone,
      cargoDescription: userInput.cargoDescription,
      contents: userInput.cargoDescription, // Alias for PDF output
      totalWeight: userInput.totalWeight,
      totalPieces: userInput.totalPieces,
      isFragile: userInput.isFragile,
      isExpress: userInput.isExpress,
      isDangerousGoods: userInput.isDangerousGoods,
      specialInstructions: userInput.specialInstructions,
      
      // Routing Information - User selected departure/destination (PRIORITY)
      portOfDeparture: departure,
      portOfDestination: destination,
      airportOfDeparture: departure, // Mirror for PDF compatibility
      airportOfDestination: destination, // Mirror for PDF compatibility
      
      // Line Items for PDF
      items: userInput.lineItems?.map(item => ({
        noOfPcs: item.pieces,
        typeOfPkg: item.type,
        description: item.description,
        grossWeight: item.weight,
        dimensions: item.dimensions || { length: 0, width: 0, height: 0 }
      })) || [],
      
      // Charges & Fees
      baseFreight: userInput.baseFreight,
      insurance: userInput.insurance,
      airportTaxVat: userInput.airportTaxVat,
      destinationDuty: userInput.destinationDuty,
      
      // Legacy field mappings for compatibility
      senderName: userInput.shipperName,
      senderAddress: userInput.shipperAddress,
      senderPhone: userInput.shipperPhone,
      receiverName: userInput.consigneeName,
      receiverAddress: userInput.consigneeAddress,
      receiverTelephone: userInput.consigneePhone,
      receiverCity: userInput.receiverCity,
      routeNumber: userInput.routeNumber,
      packageDescription: userInput.cargoDescription, // Legacy alias
      weight: userInput.totalWeight,
      pieces: userInput.totalPieces,
      numberOfPieces: userInput.totalPieces, // Legacy alias
      
      // Legacy serviceType structure
      serviceType: {
        diplomaticCourier: false,
        domestic: smartDefaults.transportMode === 'LAND',
        worldMail: smartDefaults.transportMode === 'AIR',
        repairReturn: false,
        doorToDoor: smartDefaults.transportMode === 'DOOR_TO_DOOR',
      },
      
      // Company Logo
      logoUrl: userInput.logoUrl,
      senderLogoUrl: userInput.logoUrl,
      
      // Additional metadata
      transportMode: smartDefaults.transportMode,
      waybillNumber: smartDefaults.waybillNumber,
      trackingNumber: smartDefaults.trackingNumber,
      consignmentNumber: smartDefaults.consignmentNumber,
      departureDate: smartDefaults.departureDate,
      arrivalDate: smartDefaults.estimatedArrivalDate,
      status: smartDefaults.status,
    }
  }, [smartDefaults, userInput])
  
  // Reset all data
  const reset = useCallback(() => {
    setSmartDefaults(generateSmartDefaults(mode))
    setUserInput(initialUserInput)
  }, [mode])
  
  // Check if required fields are filled
  const isValid = useMemo(() => {
    return !!(
      userInput.shipperName &&
      userInput.shipperAddress &&
      userInput.shipperPhone &&
      userInput.consigneeName &&
      userInput.consigneeAddress &&
      userInput.consigneePhone &&
      userInput.cargoDescription &&
      userInput.totalWeight &&
      userInput.totalWeight > 0
    )
  }, [userInput])
  
  return {
    // Smart defaults (read-only system generated data)
    smartDefaults,
    
    // User input (editable)
    userInput,
    updateUserInput,
    
    // Actions
    updateTransportMode,
    regenerateWaybillNumber,
    reset,
    
    // Combined data for form submission
    completeFormData,
    
    // Validation
    isValid,
    
    // Transport config
    transportConfig: TRANSPORT_CONFIG[mode],
  }
}

// Hook for address book functionality
export function useAddressBook() {
  // In a real app, this would fetch from localStorage or API
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string
    name: string
    address: string
    phone: string
    type: 'shipper' | 'consignee'
  }>>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skyship_address_book')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  
  const saveAddress = useCallback((address: {
    name: string
    address: string
    phone: string
    type: 'shipper' | 'consignee'
  }) => {
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...address,
    }
    
    setSavedAddresses(prev => {
      const updated = [...prev, newAddress]
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('skyship_address_book', JSON.stringify(updated))
      }
      return updated
    })
    
    return newAddress.id
  }, [])
  
  const deleteAddress = useCallback((id: string) => {
    setSavedAddresses(prev => {
      const updated = prev.filter(addr => addr.id !== id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('skyship_address_book', JSON.stringify(updated))
      }
      return updated
    })
  }, [])
  
  const getAddressesByType = useCallback((type: 'shipper' | 'consignee') => {
    return savedAddresses.filter(addr => addr.type === type)
  }, [savedAddresses])
  
  return {
    savedAddresses,
    saveAddress,
    deleteAddress,
    getAddressesByType,
  }
}

export default useSmartDefaults
