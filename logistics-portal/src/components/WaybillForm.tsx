'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { WaybillFormData } from '@/lib/types'
import { SKYDEX_CONFIG } from '@/lib/constants'

// Generate unique consignment number
const generateConsignmentNumber = (): string => {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `SKY-${year}-${random}`
}

interface WaybillFormProps {
  onSubmit: (data: WaybillFormData) => void
  initialData?: Partial<WaybillFormData>
}

export function WaybillForm({ onSubmit, initialData }: WaybillFormProps) {
  // Generate consignment number on mount
  const [consignmentNumber] = useState(() => initialData?.consignmentNumber || generateConsignmentNumber())
  
  // Form state
  const [formData, setFormData] = useState<WaybillFormData>({
    // 1. From (Sender)
    senderAccountNo: initialData?.senderAccountNo || '',
    senderName: initialData?.senderName || '',
    senderAddress: initialData?.senderAddress || '',
    
    // 2. To (Receiver)
    receiverName: initialData?.receiverName || '',
    receiverAddress: initialData?.receiverAddress || '',
    receiverTelephone: initialData?.receiverTelephone || '+63',
    
    // 3. Shipment Specs
    pieces: initialData?.pieces || 1,
    weight: initialData?.weight || 0,
    dimensions: initialData?.dimensions || { length: 0, width: 0, height: 0 },
    contents: initialData?.contents || 'Personal Effects',
    
    // 4. Financials
    insurance: initialData?.insurance || 0,
    airportTaxVat: initialData?.airportTaxVat || 0,
    destinationDuty: initialData?.destinationDuty || 0,
    baseFreight: initialData?.baseFreight || 0,
    currencyTotal: initialData?.currencyTotal || 0,
    
    // 5. Service Type
    serviceType: initialData?.serviceType || {
      diplomaticCourier: false,
      domestic: false,
      worldMail: false,
      repairReturn: false,
    },
    
    // 6. Dates
    departureDate: initialData?.departureDate || '',
    arrivalDate: initialData?.arrivalDate || '',
    
    // 7. Signatures
    senderSignatureUrl: initialData?.senderSignatureUrl || '',
    officialStampUrl: initialData?.officialStampUrl || '',
    
    // System generated
    consignmentNumber,
    createdAt: initialData?.createdAt || new Date().toISOString(),
  })

  // File input refs
  const senderSignatureRef = useRef<HTMLInputElement>(null)
  const officialStampRef = useRef<HTMLInputElement>(null)

  // Auto-calculate total when financial fields change
  useEffect(() => {
    const total = formData.insurance + formData.airportTaxVat + formData.destinationDuty + formData.baseFreight
    setFormData(prev => ({ ...prev, currencyTotal: total }))
  }, [formData.insurance, formData.airportTaxVat, formData.destinationDuty, formData.baseFreight])

  // Handle input changes
  const handleChange = useCallback((field: keyof WaybillFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle nested changes
  const handleNestedChange = useCallback((parent: keyof WaybillFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as object),
        [field]: value
      }
    }))
  }, [])

  // Handle service type checkbox changes
  const handleServiceTypeChange = useCallback((field: keyof WaybillFormData['serviceType'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviceType: {
        ...prev.serviceType,
        [field]: checked
      }
    }))
  }, [])

  // Handle file uploads
  const handleFileUpload = useCallback((field: 'senderSignatureUrl' | 'officialStampUrl', file: File | null) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      handleChange(field, base64)
    }
    reader.readAsDataURL(file)
  }, [handleChange])

  // Clear file
  const clearFile = useCallback((field: 'senderSignatureUrl' | 'officialStampUrl', ref: React.RefObject<HTMLInputElement | null>) => {
    handleChange(field, '')
    if (ref.current) {
      ref.current.value = ''
    }
  }, [handleChange])

  // Form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }, [formData, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header with Consignment Number */}
      <div className="bg-gradient-to-r from-[#001f3f] to-[#003d7a] p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-[#9DC400]">📋</span>
              Waybill Form
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Create a new waybill for shipment tracking
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
            <span className="text-white/60 text-xs uppercase tracking-wider">Consignment No.</span>
            <div className="text-[#9DC400] font-mono font-bold text-lg">
              {formData.consignmentNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: From (Sender) */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            1
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">From (Sender)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={formData.senderAccountNo}
              onChange={(e) => handleChange('senderAccountNo', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., ACC-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sender Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.senderName}
              onChange={(e) => handleChange('senderName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Full name"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sender Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.senderAddress}
              onChange={(e) => handleChange('senderAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              placeholder="Complete address"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 2: To (Receiver) */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
            2
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">To (Receiver)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Receiver Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receiverName}
              onChange={(e) => handleChange('receiverName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telephone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+63</span>
              <input
                type="tel"
                value={formData.receiverTelephone.replace('+63', '')}
                onChange={(e) => handleChange('receiverTelephone', '+63' + e.target.value.replace(/\D/g, ''))}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                placeholder="9123456789"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Philippines country code (+63) is pre-filled</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Receiver Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.receiverAddress}
              onChange={(e) => handleChange('receiverAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none"
              placeholder="Complete address"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 3: Shipment Specs */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
            3
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shipment Specifications</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              No. of Pieces <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.pieces}
              onChange={(e) => handleChange('pieces', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.weight}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dimensions (L × W × H cm)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="L"
                value={formData.dimensions.length || ''}
                onChange={(e) => handleNestedChange('dimensions', 'length', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <span className="flex items-center text-gray-400">×</span>
              <input
                type="number"
                placeholder="W"
                value={formData.dimensions.width || ''}
                onChange={(e) => handleNestedChange('dimensions', 'width', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <span className="flex items-center text-gray-400">×</span>
              <input
                type="number"
                placeholder="H"
                value={formData.dimensions.height || ''}
                onChange={(e) => handleNestedChange('dimensions', 'height', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contents Description
            </label>
            <input
              type="text"
              value={formData.contents}
              onChange={(e) => handleChange('contents', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              placeholder="Personal Effects"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Financials */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            4
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financials (USD)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Insurance
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.insurance || ''}
              onChange={(e) => handleChange('insurance', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Airport Tax & VAT
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.airportTaxVat || ''}
              onChange={(e) => handleChange('airportTaxVat', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destination Duty
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.destinationDuty || ''}
              onChange={(e) => handleChange('destinationDuty', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Freight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.baseFreight || ''}
              onChange={(e) => handleChange('baseFreight', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency Total
            </label>
            <div className="px-4 py-3 bg-gradient-to-r from-[#9DC400]/20 to-[#7A9A00]/20 border border-[#9DC400]/30 rounded-xl">
              <span className="text-[#9DC400] font-bold font-mono text-lg">
                ${formData.currencyTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
          </div>
        </div>
      </div>

      {/* Section 5: Service Type */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold">
            5
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Type</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'diplomaticCourier', label: 'Diplomatic Courier', icon: '📋' },
            { key: 'domestic', label: 'Domestic', icon: '🏠' },
            { key: 'worldMail', label: 'World Mail', icon: '🌍' },
            { key: 'repairReturn', label: 'Repair/Return', icon: '🔧' },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.serviceType[key as keyof WaybillFormData['serviceType']]
                  ? 'border-[#9DC400] bg-[#9DC400]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.serviceType[key as keyof WaybillFormData['serviceType']]}
                onChange={(e) => handleServiceTypeChange(key as keyof WaybillFormData['serviceType'], e.target.checked)}
                className="sr-only"
              />
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section 6: Dates */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
            6
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dates</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date of Departure <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => handleChange('departureDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Arrival Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.arrivalDate}
              onChange={(e) => handleChange('arrivalDate', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 7: Signature Uploads */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            7
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Signature Uploads</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sender Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sender Signature
            </label>
            <div className="space-y-3">
              <input
                ref={senderSignatureRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('senderSignatureUrl', e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {formData.senderSignatureUrl && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-300 bg-white">
                  <img 
                    src={formData.senderSignatureUrl} 
                    alt="Sender Signature" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => clearFile('senderSignatureUrl', senderSignatureRef)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Official Stamp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Official Authorized Stamp/Signature
            </label>
            <div className="space-y-3">
              <input
                ref={officialStampRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('officialStampUrl', e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {formData.officialStampUrl && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-300 bg-white">
                  <img 
                    src={formData.officialStampUrl} 
                    alt="Official Stamp" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => clearFile('officialStampUrl', officialStampRef)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-8 py-4 bg-gradient-to-r from-[#9DC400] to-[#7A9A00] text-[#001f3f] font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-[#8ab300] hover:to-[#6a8a00] transition-all flex items-center gap-2"
        >
          <span>Generate & Print Waybill</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      </div>
    </form>
  )
}
