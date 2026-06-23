'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSmartDefaults } from '@/hooks/useSmartDefaults'
import { AddressBookDropdown } from './AddressBookDropdown'
import { StatusToggles } from './StatusToggles'
import { LineItemsManager } from './LineItemsManager'
import { generateWaybillPDF } from './WaybillTemplate'
import { getCarrierDisplayName } from '@/lib/constants'
import type { WaybillFormData } from '@/lib/types'
import {
  type DeliveryType,
  type GeneratedTimelineEvent,
  type ShipmentTimelineInput,
  generateLocalShipmentTimeline,
} from '@/lib/localShipmentTimeline'

interface SmartWaybillFormProps {
  onGenerated?: (pdfUrl: string, waybillData: WaybillFormData) => void | Promise<void>
}

const defaultLineItems = [{ description: '', pieces: 1, weight: 0, type: 'Box' as const }]
const SERVICE_TYPE_OPTIONS = ['Standard', 'Express', 'Priority', 'Economy'] as const
const ROUTE_MODE_CODE: Record<'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR', string> = {
  AIR: 'AIR',
  SEA: 'SEA',
  LAND: 'LND',
  DOOR_TO_DOOR: 'DTD',
}
const PAYMENT_STATUS_OPTIONS = ['PAID', 'NOT PAID', 'PARTIAL PAYMENT', 'PAYMENT PENDING', 'CASH ON DELIVERY'] as const
const MODE_TERMINAL_LABEL: Record<'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR', string> = {
  AIR: 'Airport',
  SEA: 'Seaport',
  LAND: 'Land Hub',
  DOOR_TO_DOOR: 'Service Zone',
}

type TransportMode = 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'

// Derive a short location code from free-text input (e.g. "Lagos, Nigeria" → "LAG")
function getCustomLocationCode(location: string, mode: TransportMode): string {
  const trimmed = location.trim()
  if (!trimmed) return ''

  // If the user typed an explicit code like "Lagos/LOS", extract it
  const explicitCode = trimmed.match(/\/\s*([A-Za-z0-9-]{2,10})\s*$/)?.[1]
  if (explicitCode) {
    return explicitCode.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10)
  }

  // Otherwise derive from the first word
  const compact = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const baseCode = compact.slice(0, 3).padEnd(3, 'X')
  if (mode === 'SEA') return `ZZ${baseCode}`
  if (mode === 'LAND') return `${baseCode}-LND`
  if (mode === 'DOOR_TO_DOOR') return `${baseCode}-DTD`
  return baseCode
}

// Parse the typed location into display parts
function getRoutePreviewParts(location: string) {
  const trimmed = location.trim()
  if (!trimmed) return { primary: '—', secondary: 'Not set' }

  const [primary, ...codeParts] = trimmed.split('/')
  return {
    primary: primary.trim() || trimmed,
    secondary: codeParts.join('/').trim() || '',
  }
}

// SVG Icons
const Icons = {
  shipper: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  air: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  sea: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  land: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  doorToDoor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  lightning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  pin: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export function SmartWaybillForm({ onGenerated }: SmartWaybillFormProps) {
  const [transportMode, setTransportMode] = useState<TransportMode>('AIR')

  // Free-text departure and destination — user types directly, no dropdown preset
  const [departureLocationInput, setDepartureLocationInput] = useState('')
  const [destinationLocationInput, setDestinationLocationInput] = useState('')

  const {
    smartDefaults,
    userInput,
    updateUserInput,
    updateTransportMode,
    regenerateWaybillNumber,
    completeFormData,
    isValid,
    transportConfig,
  } = useSmartDefaults(transportMode)

  const carrierDisplayName = useMemo(() => getCarrierDisplayName(transportMode), [transportMode])

  const transportCodeLabel = useMemo(() => {
    if (transportMode === 'SEA') return 'SCAC Code'
    if (transportMode === 'AIR') return 'IATA AWB Prefix'
    return 'Carrier Code'
  }, [transportMode])

  const terminalLabel = MODE_TERMINAL_LABEL[transportMode]
  const routeSymbol = transportMode === 'SEA' ? 'SHIP' : transportMode === 'LAND' ? 'TRUCK' : transportMode === 'DOOR_TO_DOOR' ? 'DOOR' : 'AIR'

  // The values used everywhere downstream — what the user typed (trimmed)
  const departureRouteLocation = departureLocationInput.trim()
  const destinationRouteLocation = destinationLocationInput.trim()

  const departureRoutePreview = getRoutePreviewParts(departureRouteLocation)
  const destinationRoutePreview = getRoutePreviewParts(destinationRouteLocation)

  const autoRouteNumber = useMemo(() => {
    const modeCode = ROUTE_MODE_CODE[transportMode]
    const departureCode = getCustomLocationCode(departureRouteLocation, transportMode) || 'DEP'
    const destinationCode = getCustomLocationCode(destinationRouteLocation, transportMode) || 'DST'
    const waybillSuffix = (smartDefaults.waybillNumber || 'AUTO').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase() || 'AUTO'
    return `RT-${modeCode}-${departureCode}-${destinationCode}-${waybillSuffix}`
  }, [departureRouteLocation, destinationRouteLocation, smartDefaults.waybillNumber, transportMode])

  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState<(typeof SERVICE_TYPE_OPTIONS)[number]>('Standard')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DOOR_TO_DOOR')
  const [projectedTimeline, setProjectedTimeline] = useState<GeneratedTimelineEvent[]>(() =>
    generateLocalShipmentTimeline({
      shipmentMode: transportMode,
      serviceType: 'Standard',
      deliveryType: 'DOOR_TO_DOOR',
      origin: '',
      destination: '',
      departureDate: smartDefaults.dateOfIssue,
      estimatedDeliveryDate: smartDefaults.estimatedArrivalDate,
    })
  )

  const buildTimelineInput = useCallback(
    (overrides: Partial<ShipmentTimelineInput> = {}): ShipmentTimelineInput => ({
      shipmentMode: overrides.shipmentMode || transportMode,
      serviceType: overrides.serviceType || serviceType,
      deliveryType: overrides.deliveryType || deliveryType,
      origin: overrides.origin ?? (userInput.portOfDeparture || departureRouteLocation),
      destination: overrides.destination ?? (userInput.portOfDestination || destinationRouteLocation),
      departureDate: overrides.departureDate || smartDefaults.dateOfIssue,
      estimatedDeliveryDate: overrides.estimatedDeliveryDate || smartDefaults.estimatedArrivalDate,
    }),
    [
      deliveryType,
      departureRouteLocation,
      destinationRouteLocation,
      serviceType,
      smartDefaults.dateOfIssue,
      smartDefaults.estimatedArrivalDate,
      transportMode,
      userInput.portOfDeparture,
      userInput.portOfDestination,
    ]
  )

  const regenerateProjectedTimeline = useCallback((overrides: Partial<ShipmentTimelineInput> = {}) => {
    setProjectedTimeline(generateLocalShipmentTimeline(buildTimelineInput(overrides)))
  }, [buildTimelineInput])

  useEffect(() => {
    regenerateProjectedTimeline({
      departureDate: smartDefaults.dateOfIssue,
      estimatedDeliveryDate: smartDefaults.estimatedArrivalDate,
    })
  }, [regenerateProjectedTimeline, smartDefaults.dateOfIssue, smartDefaults.estimatedArrivalDate])

  const handleTransportModeChange = (mode: TransportMode) => {
    setTransportMode(mode)
    updateTransportMode(mode)

    const syncedDeliveryType: DeliveryType = mode === 'DOOR_TO_DOOR' ? 'DOOR_TO_DOOR' : deliveryType
    if (mode === 'DOOR_TO_DOOR' && deliveryType !== 'DOOR_TO_DOOR') {
      setDeliveryType('DOOR_TO_DOOR')
    }
    // Keep whatever the user typed — just re-run timeline with new mode
    regenerateProjectedTimeline({ shipmentMode: mode, deliveryType: syncedDeliveryType })
  }

  const handleDepartureLocationInput = (value: string) => {
    setDepartureLocationInput(value)
    updateUserInput('portOfDeparture', value.trim())
    regenerateProjectedTimeline({ origin: value.trim() })
  }

  const handleDestinationLocationInput = (value: string) => {
    setDestinationLocationInput(value)
    updateUserInput('portOfDestination', value.trim())
    regenerateProjectedTimeline({ destination: value.trim() })
  }

  const handleServiceTypeChange = (value: (typeof SERVICE_TYPE_OPTIONS)[number]) => {
    setServiceType(value)
    regenerateProjectedTimeline({ serviceType: value })
  }

  const handleDeliveryTypeChange = (value: DeliveryType) => {
    setDeliveryType(value)
    regenerateProjectedTimeline({ deliveryType: value })
  }

  const handleGenerate = async () => {
    if (!isValid) {
      alert('Please fill in all required fields: Shipper info, Consignee info, and Description')
      return
    }

    setIsGenerating(true)
    try {
      const departureForWaybill = completeFormData.portOfDeparture as string || departureRouteLocation
      const destinationForWaybill = completeFormData.portOfDestination as string || destinationRouteLocation
      const timelineForWaybill = generateLocalShipmentTimeline(
        buildTimelineInput({
          origin: departureForWaybill,
          destination: destinationForWaybill,
          departureDate: completeFormData.dateOfIssue || completeFormData.departureDate || smartDefaults.dateOfIssue,
          estimatedDeliveryDate: completeFormData.estimatedArrivalDate || completeFormData.estimatedDeliveryDate,
        })
      )

      setProjectedTimeline(timelineForWaybill)

      const localTimelineForWaybill = timelineForWaybill.map((event) => ({
        status: event.status,
        location: event.location,
        description: event.description,
        eventTime: event.eventTime,
        isHold: event.isHold,
      }))

      const waybillData: WaybillFormData = {
        ...completeFormData,
        portOfDeparture: departureForWaybill,
        portOfDestination: destinationForWaybill,
        airportOfDeparture: departureForWaybill,
        airportOfDestination: destinationForWaybill,
        paymentStatus: userInput.paymentStatus || 'NOT PAID',
        routeNumber: autoRouteNumber,
        serviceTypeString: serviceType,
        deliveryType,
        trackingEvents: localTimelineForWaybill,
      }
      const pdfUrl = await generateWaybillPDF(waybillData)

      setGeneratedPdfUrl(pdfUrl)
      setShowPreview(true)
      if (onGenerated) {
        await onGenerated(pdfUrl, waybillData)
      }

      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `waybill_${waybillData.waybillNumber}.pdf`
      link.click()

      alert(`Waybill ${waybillData.waybillNumber} generated successfully!`)
    } catch (error) {
      console.error('Error generating waybill:', error)
      const message = error instanceof Error ? error.message : 'Error generating waybill. Please try again.'
      alert(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'AIR': return Icons.air
      case 'SEA': return Icons.sea
      case 'LAND': return Icons.land
      case 'DOOR_TO_DOOR': return Icons.doorToDoor
      default: return Icons.air
    }
  }

  return (
    <div className="space-y-6">
      {/* Transport Mode Selection */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <label className="block text-sm font-semibold text-gray-900 mb-3">Transport Mode</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['AIR', 'SEA', 'LAND', 'DOOR_TO_DOOR'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleTransportModeChange(mode)}
              className={`px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                transportMode === mode
                  ? 'bg-[#001f3f] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTransportIcon(mode)}
              <span className="hidden sm:inline">{mode === 'DOOR_TO_DOOR' ? 'Door to Door' : mode}</span>
              <span className="sm:hidden">{mode === 'DOOR_TO_DOOR' ? 'DTD' : mode}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Estimated delivery: <span className="font-semibold text-[#001f3f]">{transportConfig.baseTransitDays} days</span> | Speed: {transportConfig.avgSpeedKmh} km/h
        </p>
      </div>

      {/* Auto-Generated Info */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-sm font-bold text-[#9DC400] mb-3 flex items-center gap-2 uppercase tracking-wide">
          {Icons.lightning}
          Auto-Generated Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">Waybill Number:</span>
            <span className="font-mono text-[#9DC400] font-bold">{smartDefaults.waybillNumber}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">Date:</span>
            <span className="text-white font-semibold">{formatDate(smartDefaults.dateOfIssue)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg md:col-span-2">
            <span className="text-gray-300 font-medium">Carrier:</span>
            <span className="text-white font-semibold text-right">{carrierDisplayName}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">{transportCodeLabel}:</span>
            <span className="font-mono text-white font-semibold">{smartDefaults.iataCode}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">Status:</span>
            <span className="text-[#9DC400] font-bold uppercase">{smartDefaults.status}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg md:col-span-2">
            <span className="text-gray-300 font-medium">Payment Status:</span>
            <select
              value={userInput.paymentStatus || 'NOT PAID'}
              onChange={(e) => updateUserInput('paymentStatus', e.target.value as typeof PAYMENT_STATUS_OPTIONS[number])}
              className="w-56 rounded-lg border border-white/30 bg-white/20 px-3 py-1 text-right text-white focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400]"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-gray-900">{option}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg md:col-span-2">
            <span className="text-gray-300 font-medium">Route Number:</span>
            <span className="rounded-lg border border-white/30 bg-white/20 px-3 py-1 font-mono font-semibold text-white">
              {autoRouteNumber}
            </span>
          </div>
        </div>
        <button
          onClick={regenerateWaybillNumber}
          className="mt-3 text-xs text-[#9DC400] hover:text-[#B8D940] underline flex items-center gap-1"
        >
          {Icons.refresh} Regenerate Waybill Number
        </button>
      </div>

      {/* Routing & Destination — fully manual text inputs */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-1 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400] text-[10px] font-bold">ROUTE</span>
          Routing & Destination
        </h4>
        <p className="text-xs text-white/50 mb-4">
          Type any city, country or hub name. The map will detect and plot your route automatically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Departure */}
          <div className="p-4 bg-white/10 rounded-xl border border-white/20">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#9DC400] mb-1 uppercase tracking-wide">
              {Icons.pin}
              Departure {terminalLabel}
            </label>
            <p className="text-xs text-white/45 mb-3">
              Type the departure city, country, or hub — e.g. &ldquo;Lagos, Nigeria&rdquo; or &ldquo;London/LHR&rdquo;
            </p>
            <input
              type="text"
              value={departureLocationInput}
              onChange={(e) => handleDepartureLocationInput(e.target.value)}
              className="w-full px-4 py-3 min-h-12 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/35 font-semibold focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder={`e.g. London, United Kingdom`}
            />
            {departureRouteLocation && (
              <p className="text-xs text-white/50 mt-2 wrap-break-word">
                Detected: <span className="text-[#9DC400]">{departureRouteLocation}</span>
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="p-4 bg-white/10 rounded-xl border border-white/20">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#9DC400] mb-1 uppercase tracking-wide">
              {Icons.pin}
              Destination {terminalLabel}
            </label>
            <p className="text-xs text-white/45 mb-3">
              Type the destination city, country, or hub — e.g. &ldquo;New York, USA&rdquo; or &ldquo;Dubai/DXB&rdquo;
            </p>
            <input
              type="text"
              value={destinationLocationInput}
              onChange={(e) => handleDestinationLocationInput(e.target.value)}
              className="w-full px-4 py-3 min-h-12 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/35 font-semibold focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder={`e.g. New York, United States`}
            />
            {destinationRouteLocation && (
              <p className="text-xs text-white/50 mt-2 wrap-break-word">
                Detected: <span className="text-[#9DC400]">{destinationRouteLocation}</span>
              </p>
            )}
          </div>
        </div>

        {/* Route Preview */}
        <div className="mt-4 p-3 bg-[#9DC400]/10 rounded-lg border border-[#9DC400]/30">
          <div className="flex flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:gap-4">
            <div className="w-full min-w-0 text-center sm:w-1/3">
              <span className="block wrap-break-word text-[#9DC400] font-bold text-base sm:text-lg">{departureRoutePreview.primary}</span>
              {departureRoutePreview.secondary && (
                <span className="wrap-break-word text-white/60 text-xs">{departureRoutePreview.secondary}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[#9DC400] text-xs font-semibold">{routeSymbol}</span>
              <div className="w-10 h-0.5 bg-[#9DC400]/50 sm:w-16" />
              <span className="text-white/40">→</span>
              <div className="w-10 h-0.5 bg-[#9DC400]/50 sm:w-16" />
              <span className="text-[#9DC400] text-xs font-semibold">{routeSymbol}</span>
            </div>
            <div className="w-full min-w-0 text-center sm:w-1/3">
              <span className="block wrap-break-word text-[#9DC400] font-bold text-base sm:text-lg">{destinationRoutePreview.primary}</span>
              {destinationRoutePreview.secondary && (
                <span className="wrap-break-word text-white/60 text-xs">{destinationRoutePreview.secondary}</span>
              )}
            </div>
          </div>
          {(!departureRouteLocation || !destinationRouteLocation) && (
            <p className="text-center text-xs text-white/40 mt-2">Enter both locations above to preview the route</p>
          )}
        </div>
      </div>

      {/* Shipper Information */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400] text-[10px] font-bold">SHIP</span>
          Shipper (FROM)
        </h4>
        <div className="mb-4">
          <AddressBookDropdown
            type="shipper"
            onSelect={(name, address, phone) => {
              updateUserInput('shipperName', name)
              updateUserInput('shipperAddress', address)
              updateUserInput('shipperPhone', phone)
            }}
            className="mb-3"
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Shipper Name *</label>
            <input
              type="text"
              value={userInput.shipperName || ''}
              onChange={(e) => updateUserInput('shipperName', e.target.value)}
              className="w-full px-4 py-3 min-h-12 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder="Enter shipper/company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Shipper Address</label>
            <textarea
              value={userInput.shipperAddress || ''}
              onChange={(e) => updateUserInput('shipperAddress', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition resize-none"
              placeholder="Full address including city, state, postal code, country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Shipper Phone</label>
            <input
              type="tel"
              value={userInput.shipperPhone || ''}
              onChange={(e) => updateUserInput('shipperPhone', e.target.value)}
              className="w-full px-4 py-3 min-h-12 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder="+447352998900"
            />
          </div>
        </div>
      </div>

      {/* Consignee Information */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400] text-[10px] font-bold">CONS</span>
          Consignee (TO)
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Consignee Name *</label>
            <input
              type="text"
              value={userInput.consigneeName || ''}
              onChange={(e) => updateUserInput('consigneeName', e.target.value)}
              className="w-full px-4 py-3 min-h-12 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder="Enter consignee/recipient name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Consignee Address</label>
            <textarea
              value={userInput.consigneeAddress || ''}
              onChange={(e) => updateUserInput('consigneeAddress', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition resize-none"
              placeholder="Full address including city, state, postal code, country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Consignee Phone</label>
            <input
              type="tel"
              value={userInput.consigneePhone || ''}
              onChange={(e) => updateUserInput('consigneePhone', e.target.value)}
              className="w-full px-4 py-3 min-h-12 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder="+447352998900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Receiver City</label>
            <input
              type="text"
              value={userInput.receiverCity || ''}
              onChange={(e) => updateUserInput('receiverCity', e.target.value)}
              className="w-full px-4 py-3 min-h-12 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
              placeholder="e.g., London, New York, Lagos"
            />
          </div>
        </div>
      </div>

      {/* Description of Goods */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400] text-[10px] font-bold">ITEMS</span>
          Description of Goods
        </h4>
        <div className="space-y-4">
          <LineItemsManager
            items={userInput.lineItems || defaultLineItems}
            onChange={useCallback((items) => {
              updateUserInput('lineItems', items)
              const totalPieces = items.reduce((sum, item) => sum + (item.pieces || 0), 0)
              const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0)
              const cargoDescription = items.map(item => item.description).filter(Boolean).join(', ')
              updateUserInput('totalPieces', totalPieces)
              updateUserInput('totalWeight', totalWeight)
              updateUserInput('cargoDescription', cargoDescription || items[0]?.description || '')
            }, [updateUserInput])}
          />
          <div className="pt-2 border-t border-white/20">
            <label className="block text-sm font-medium text-white/80 mb-2">Special Handling</label>
            <StatusToggles
              isFragile={userInput.isFragile || false}
              isExpress={userInput.isExpress || false}
              onFragileChange={(value) => updateUserInput('isFragile', value)}
              onExpressChange={(value) => updateUserInput('isExpress', value)}
            />
          </div>
        </div>
      </div>

      {/* Charges & Fees */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400] text-[10px] font-bold">FEES</span>
          Charges & Fees (USD)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Base Freight', key: 'baseFreight' as const },
            { label: 'Insurance', key: 'insurance' as const },
            { label: 'Airport Tax/VAT', key: 'airportTaxVat' as const },
            { label: 'Destination Duty', key: 'destinationDuty' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={userInput[key] || 0}
                onChange={(e) => updateUserInput(key, parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 min-h-12 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400] transition"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-[#9DC400]/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[#9DC400] font-bold">TOTAL CHARGES:</span>
            <span className="text-[#9DC400] font-mono font-bold text-lg">
              ${((userInput.baseFreight || 0) + (userInput.insurance || 0) + (userInput.airportTaxVat || 0) + (userInput.destinationDuty || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipment Totals */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400] text-[10px] font-bold">TOTAL</span>
          Shipment Totals
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <span className="text-gray-400 text-sm">Total Pieces:</span>
            <p className="text-white font-bold text-lg">{userInput.totalPieces || 1}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-lg">
            <span className="text-gray-400 text-sm">Total Weight:</span>
            <p className="text-white font-bold text-lg">{(userInput.totalWeight || 0).toFixed(2)} KG</p>
          </div>
        </div>
      </div>

      {/* Projected Timeline */}
      <div className="p-4 rounded-2xl bg-[#001f3f] border-2 border-[#9DC400] shadow-lg">
        <h4 className="text-lg font-semibold text-[#9DC400] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#9DC400]/20 flex items-center justify-center text-[#9DC400]">Preview</span>
          Projected Timeline
        </h4>
        <p className="text-xs text-white/70 mb-4">
          Local projection based on transport mode. Full timeline control appears below after loading an existing waybill number.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => handleServiceTypeChange(e.target.value as (typeof SERVICE_TYPE_OPTIONS)[number])}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400]"
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-gray-900">{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Delivery Type</label>
            <select
              value={deliveryType}
              onChange={(e) => handleDeliveryTypeChange(e.target.value as DeliveryType)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#9DC400] focus:border-[#9DC400]"
            >
              <option value="DOOR_TO_DOOR" className="text-gray-900">Door to Door</option>
              <option value="OFFICE_PICKUP" className="text-gray-900">Office Pickup</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => regenerateProjectedTimeline()}
              className="w-full px-3 py-2 rounded-lg bg-[#9DC400] text-[#001f3f] font-semibold hover:bg-[#B8D940] transition"
            >
              Regenerate Timeline
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Milestones</p>
            <p className="mt-1 text-sm font-semibold text-white">{projectedTimeline.length}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Start</p>
            <p className="mt-1 text-sm font-semibold text-white">{projectedTimeline[0]?.status || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/60">End</p>
            <p className="mt-1 text-sm font-semibold text-white">{projectedTimeline[projectedTimeline.length - 1]?.status || 'N/A'}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/60">
          For full event details, load a generated waybill number in <span className="text-[#9DC400] font-semibold">Existing Waybill Timeline Control</span>.
        </p>
      </div>

      {/* Terms & Conditions */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-white/80 mb-2">Terms & Conditions</h4>
        <p className="text-xs text-white/50 leading-relaxed">{smartDefaults.termsAndConditions}</p>
      </div>

      {/* Generate Button */}
      <div className="sticky bottom-4 z-50 md:relative md:bottom-auto">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !isValid}
          className="w-full py-4 px-6 min-h-14 rounded-xl font-bold text-lg transition-all bg-linear-to-r from-[#9DC400] to-[#7A9A00] text-[#001f3f] shadow-lg hover:shadow-xl hover:from-[#8ab300] hover:to-[#6a8a00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              {Icons.document}
              Generate Waybill
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      {showPreview && generatedPdfUrl && (
        <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-3">Generated Waybill Preview</h4>
          <div className="overflow-x-auto rounded-lg border border-white/20">
            <iframe src={generatedPdfUrl} className="w-full h-96 bg-white" title="Waybill Preview" />
          </div>
          <div className="mt-3 flex gap-2">
            <a
              href={generatedPdfUrl}
              download={`waybill_${smartDefaults.waybillNumber}.pdf`}
              className="flex-1 py-3 px-4 rounded-xl bg-[#9DC400] text-[#001f3f] font-semibold text-center hover:bg-[#B8D940] transition"
            >
              Download PDF
            </a>
            <button
              onClick={() => window.open(generatedPdfUrl, '_blank')}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartWaybillForm
