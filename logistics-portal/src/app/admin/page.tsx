"use client";
// Helper to get currency symbol (must be outside the React component)
function getCurrencySymbol(cur: string) {
  switch (cur) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'CHF': return 'CHF ';
    case 'SEK': return 'kr ';
    case 'NOK': return 'kr ';
    case 'DKK': return 'kr ';
    case 'PLN': return 'zł ';
    case 'CZK': return 'Kč ';
    case 'JPY': return '¥';
    case 'CNY': return '¥';
    case 'INR': return '₹';
    case 'KRW': return '₩';
    case 'SGD': return 'S$';
    case 'HKD': return 'HK$';
    case 'CAD': return 'C$';
    case 'MXN': return 'Mex$';
    case 'BRL': return 'R$';
    case 'ARS': return 'ARS$';
    case 'CLP': return 'CLP$';
    case 'PHP': return 'PHP ';
    default: return '';
  }
}
import { db } from "@/lib/firebase";
import { useState, useRef, useEffect, useCallback } from "react";
// Local ReceiptItem type (not exported from types.ts)
type ReceiptItem = { description: string; quantity: number; unitPrice?: number; total?: number };
import type { DocumentConfig } from "@/lib/types";
import { GREENHILLS_CONFIG, SKYSHIP_CONFIG, generateTrackingId } from "@/lib/constants";
import { generateDocumentPDF } from "@/components/DocumentTemplate";
import SmartWaybillForm from "@/components/SmartWaybillForm";

const ADMIN_AUTH_KEY = 'skyship_admin_auth'

export default function AdminPage() {
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    const stored = window.sessionStorage.getItem(ADMIN_AUTH_KEY)
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
    setIsAuthReady(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })

      if (!response.ok) {
        setLoginError('Invalid username or password')
        return
      }

      window.sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
      setIsAuthenticated(true)
      setLoginError('')
      setLoginPassword('')
    } catch {
      setLoginError('Unable to login right now. Please try again.')
    }
  }

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_AUTH_KEY)
    setIsAuthenticated(false)
    setLoginUsername('')
    setLoginPassword('')
    setLoginError('')
  }

  const [type, setType] = useState<'RECEIPT' | 'WAYBILL'>('RECEIPT')
  const [companyName, setCompanyName] = useState('Greenhills Chemical Incorporation')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [companyAddress] = useState<string>(GREENHILLS_CONFIG.address)
  const [companyPhone] = useState<string>(GREENHILLS_CONFIG.phone)
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [taxRate, setTaxRate] = useState(16)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [paid, setPaid] = useState(0);
  const [balance, setBalance] = useState(0);
  const [generated, setGenerated] = useState<DocumentConfig[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // New professional fields
  const [receiptNumber, setReceiptNumber] = useState('')
  const [dateOfIssue, setDateOfIssue] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'POS' | 'Credit Card'>('Cash')
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'JPY' | 'CNY' | 'INR' | 'KRW' | 'SGD' | 'HKD' | 'CAD' | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'PHP'>('USD')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [applyStamp, setApplyStamp] = useState(false)
  const [notes, setNotes] = useState('Thank you for your business. Items once sold are not returnable.')
  const [receiptDescription, setReceiptDescription] = useState('') // NEW: Receipt description/memo
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null) // NEW: Store last PDF URL for printing
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {description: '', quantity: 0, unitPrice: 0, total: 0}])
  }, [])

  const updateItem = useCallback((index: number, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      let updated = { ...item, [field]: value };
      // If quantity or unitPrice changes, recalc total
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      }
      // If total is edited, recalc unitPrice if quantity > 0
      if (field === 'total' && Number(updated.quantity) > 0) {
        updated.unitPrice = Number(updated.total) / Number(updated.quantity);
      }
      return updated;
    }))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, GIF)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setLogoUrl(base64)
      setLogoPreview(base64)
    }
    reader.onerror = () => {
      alert('Error reading file. Please try again.')
    }
    reader.readAsDataURL(file)
  }, [])

  const clearLogo = useCallback(() => {
    setLogoUrl('')
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleSignatureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, GIF)')
      return
    }

    // Validate file size (max 2MB for signature)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setSignatureUrl(base64)
      setSignaturePreview(base64)
    }
    reader.onerror = () => {
      alert('Error reading file. Please try again.')
    }
    reader.readAsDataURL(file)
  }, [])

  const clearSignature = useCallback(() => {
    setSignatureUrl('')
    setSignaturePreview(null)
    if (signatureInputRef.current) {
      signatureInputRef.current.value = ''
    }
  }, [])

  const toggleType = (newType: 'RECEIPT' | 'WAYBILL') => {
    setType(newType)
    if (newType === 'RECEIPT') {
      setCompanyName(GREENHILLS_CONFIG.name)
      setLogoUrl(GREENHILLS_CONFIG.logo)
      setLogoPreview(null)
    } else {
      setCompanyName(SKYSHIP_CONFIG.name)
      setLogoUrl(SKYSHIP_CONFIG.logo)
      setLogoPreview(null)
    }
  }

  const generate = async () => {
    try {
      const trackingNumber = generateTrackingId()
      const doc: DocumentConfig = {
        companyName,
        logoUrl: logoUrl || '',
        type,
        items: items.map(item => ({...item, price: item.unitPrice})),
        origin,
        destination,
        trackingNumber,
        status: 'PENDING',
        // New professional fields
        receiptNumber: receiptNumber || trackingNumber,
        dateOfIssue: dateOfIssue || new Date().toISOString().split('T')[0],
        paymentMethod,
        currency,
        signatureUrl: signatureUrl || '',
        applyStamp,
        notes: notes || '',
        companyAddress: companyAddress || GREENHILLS_CONFIG.address,
        companyPhone: companyPhone || GREENHILLS_CONFIG.phone,
        customerName: customerName || '',
        customerAddress: customerAddress || '',
        taxRate: taxRate || 0,
        paid,
        balance,
        receiptDescription: receiptDescription || '',
        description: receiptDescription || '',
      }

      console.log('Generating PDF with data:', doc)
      const pdfUrl = await generateDocumentPDF(doc)
      console.log('PDF generated successfully:', pdfUrl)
      
      // Store URL for printing
      setLastGeneratedUrl(pdfUrl)
      
      // Optional: open or preview
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${type.toLowerCase()}_${trackingNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setGenerated(prev => [doc, ...prev.slice(0, 4)])
      
      // Show success message
      alert(`${type} generated successfully!`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Error generating ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // NEW: Print function
  const handlePrint = () => {
    if (!lastGeneratedUrl) {
      alert('Please generate a receipt first before printing.')
      return
    }
    
    // Open PDF in new window for printing
    const printWindow = window.open(lastGeneratedUrl, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (item.total || (item.quantity * (item.unitPrice || 0))), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  useEffect(() => {
    setBalance(total - paid);
  }, [total, paid]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-white/80 text-sm">Loading admin access...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Login</h1>
          <p className="text-white/70 text-sm mt-2">Sign in to access the admin dashboard.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-black/30 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-black/30 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {loginError && <p className="text-red-300 text-sm">{loginError}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-lime-500 py-3 font-semibold text-[#0b1b33] hover:bg-lime-400 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-6xl space-y-8">
        <div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Admin Dashboard
            </h2>
            <button
              type="button"
              onClick={handleLogout}
              className="self-start sm:self-auto px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
            >
              Logout
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create receipt or waybill
          </p>
        </div>

        <div className="bg-white dark:bg-black/20 shadow-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-800">
          {/* Toggle */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => toggleType('RECEIPT')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  type === 'RECEIPT'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Receipt
              </button>
              <button
                onClick={() => toggleType('WAYBILL')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  type === 'WAYBILL'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Waybill
              </button>
            </div>
            
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo
              </label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoPreview && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={clearLogo}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      title="Remove logo"
                    >
                      ×
                    </button>
                  </div>
                )}
                {!logoPreview && logoUrl && !logoUrl.startsWith('data:') && (
                  <div className="text-xs text-gray-500">
                    Using default logo URL
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Address
              </label>
              <input
                type="text"
                value={companyAddress}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white"
                placeholder="123 Business St, City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Phone
              </label>
              <input
                type="tel"
                value={companyPhone}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white"
                placeholder="+447352998900"
              />
            </div>
          </div>

          {/* RECEIPT MODE: Receipt Settings - Glassmorphism Style */}
          {type === 'RECEIPT' && (
            <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">📄</span>
                Receipt Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                    placeholder="e.g., RCP-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Issue
                  </label>
                  <input
                    type="date"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-black/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                  />
                </div>
                
              </div>
            </div>
          )}

          {/* RECEIPT MODE: Payment Details - Glassmorphism Style */}
          {type === 'RECEIPT' && (
            <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">💳</span>
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="POS">POS</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="SEK">SEK - Swedish Krona</option>
                    <option value="NOK">NOK - Norwegian Krone</option>
                    <option value="DKK">DKK - Danish Krone</option>
                    <option value="PLN">PLN - Polish Zloty</option>
                    <option value="CZK">CZK - Czech Koruna</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="HKD">HKD - Hong Kong Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                    <option value="ARS">ARS - Argentine Peso</option>
                    <option value="CLP">CLP - Chilean Peso</option>
                    <option value="PHP">PHP - Filipino Peso</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paid</label>
                  <input
                    type="number"
                    min="0"
                    value={paid}
                    onChange={e => setPaid(Number(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Balance</label>
                  <input
                    type="number"
                    min="0"
                    value={balance}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-black/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer/Ship */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              {type === 'RECEIPT' ? 'Customer' : 'Customer / Shipment From'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Customer Address"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50"
                />
              </div>
            </div>
          </div>

          {/* WAYBILL MODE: Smart Waybill Form */}
          {type === 'WAYBILL' && (
            <div className="mb-8">
              <SmartWaybillForm
                onGenerated={async (pdfUrl, waybillData) => {
                  const now = new Date().toISOString();
                  const waybillNumber = waybillData.waybillNumber || waybillData.trackingNumber || '';
                  const origin = waybillData.portOfDeparture || waybillData.airportOfDeparture || 'Not provided';
                  const destination = waybillData.portOfDestination || waybillData.airportOfDestination || 'Not provided';
                  const lifecycleEvents = [
                    {
                      status: 'Shipment Received',
                      location: origin,
                      description: 'Shipment has been received for processing.',
                      eventTime: now,
                    },
                    {
                      status: 'Shipment Created',
                      location: origin,
                      description: 'Waybill has been created successfully.',
                      eventTime: new Date(Date.now() + 1000).toISOString(),
                    },
                  ];

                  const serviceTypeLabel =
                    waybillData.serviceTypeString ||
                    (waybillData.serviceType?.doorToDoor
                      ? 'Door to Door'
                      : waybillData.serviceType?.worldMail
                      ? 'World Mail'
                      : waybillData.serviceType?.domestic
                      ? 'Domestic'
                      : waybillData.serviceType?.diplomaticCourier
                      ? 'Diplomatic Courier'
                      : waybillData.serviceType?.repairReturn
                      ? 'Repair Return'
                      : 'Not provided');

                  const waybillDoc = {
                    ...waybillData,
                    waybillNumber,
                    senderName: waybillData.senderName || waybillData.shipperName || '',
                    senderPhone: waybillData.senderPhone || waybillData.shipperPhone || '',
                    senderAddress: waybillData.senderAddress || waybillData.shipperAddress || '',
                    receiverName: waybillData.receiverName || waybillData.consigneeName || '',
                    receiverPhone: waybillData.receiverPhone || waybillData.consigneePhone || waybillData.receiverTelephone || '',
                    receiverAddress: waybillData.receiverAddress || waybillData.consigneeAddress || '',
                    origin,
                    destination,
                    shipmentMode: waybillData.transportMode || waybillData.shipmentMode || '',
                    serviceType: serviceTypeLabel,
                    serviceTypeString: serviceTypeLabel,
                    parcelDescription: waybillData.cargoDescription || waybillData.packageDescription || waybillData.contents || '',
                    cargoDescription: waybillData.cargoDescription || '',
                    packageDescription: waybillData.packageDescription || waybillData.cargoDescription || '',
                    quantity: waybillData.totalPieces || waybillData.pieces || waybillData.numberOfPieces || 1,
                    totalPieces: waybillData.totalPieces || waybillData.pieces || waybillData.numberOfPieces || 1,
                    weight: waybillData.totalWeight || waybillData.weight || 0,
                    totalWeight: waybillData.totalWeight || waybillData.weight || 0,
                    dimensions: waybillData.dimensions || '',
                    currentStatus: 'Shipment Created',
                    currentLocation: origin,
                    bookingDate: waybillData.dateOfIssue || now,
                    estimatedDeliveryDate: waybillData.estimatedArrivalDate || waybillData.estimatedDeliveryDate || waybillData.arrivalDate || '',
                    deliveredDate: '',
                    paymentStatus: waybillData.paymentStatus || 'Not provided',
                    specialInstructions: waybillData.specialInstructions || '',
                    createdAt: waybillData.createdAt || now,
                    updatedAt: now,
                    trackingEvents: lifecycleEvents,
                  };
                  try {
                    const { createWaybill } = await import('@/services/waybillService');
                    await createWaybill(waybillDoc);
                    alert(`Waybill ${waybillNumber} saved successfully.`);
                  } catch (err) {
                    alert('Error saving waybill.');
                    console.error(err);
                  }
                }}
              />
            </div>
          )}

          {/* RECEIPT MODE: Items Table */}
          {type === 'RECEIPT' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Items / Goods
                </label>
                <button
                  onClick={addItem}
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  Add Item
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                    <div className="sm:col-span-2 lg:col-span-5">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Item description"
                      />
                    </div>
                    <div className="sm:col-span-1 lg:col-span-2">
                      <label className="block text-sm font-medium mb-1">Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg text-center"
                      />
                    </div>
                    <div className="sm:col-span-1 lg:col-span-2">
                      <label className="block text-sm font-medium mb-1">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-1 lg:col-span-2">
                      <label className="block text-sm font-medium mb-1">Total</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.total || (item.quantity * (item.unitPrice || 0))}
                        onChange={(e) => updateItem(index, 'total', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded-lg text-right font-mono"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      type="button"
                      className="sm:col-span-2 lg:col-span-1 px-3 py-2 text-red-600 hover:text-red-800 border border-red-200 rounded-lg bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authorized Signatory - Glassmorphism Style */}
          <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">✍️</span>
              Authorized Signatory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Digital Signature
                </label>
                <div className="space-y-3">
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 backdrop-blur-sm"
                  />
                  {signaturePreview && (
                    <div className="relative w-32 h-16 rounded-lg overflow-hidden border border-gray-300 bg-white">
                      <img 
                        src={signaturePreview} 
                        alt="Signature preview" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={clearSignature}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        title="Remove signature"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-14 h-8 rounded-full transition-colors ${applyStamp ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <input
                      type="checkbox"
                      checked={applyStamp}
                      onChange={(e) => setApplyStamp(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${applyStamp ? 'translate-x-6' : ''}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apply Digital Company Stamp
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes - Glassmorphism Style */}
          <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">📝</span>
              Terms & Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes / Terms & Conditions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm resize-none"
                placeholder="Enter terms, conditions, or additional notes..."
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt Description / Memo
              </label>
              <textarea
                value={receiptDescription}
                onChange={(e) => setReceiptDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm resize-none"
                placeholder="e.g., Payment for chemical supplies - Invoice #12345"
              />
            </div>
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>{getCurrencySymbol(currency)}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <label>Tax Rate (%): </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border rounded text-right"
                />
              </div>
              <div className="flex justify-between text-lg font-semibold mb-4">
                <span>Tax:</span>
                <span>{getCurrencySymbol(currency)}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>Paid:</span>
                <span>{getCurrencySymbol(currency)}{paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>Balance:</span>
                <span>{getCurrencySymbol(currency)}{balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>{getCurrencySymbol(currency)}{total.toFixed(2)}</span>
              </div>
            </div>
          )}


          {/* Generate & Print Buttons */}
          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={generate}
              disabled={items.length === 0}
              className="w-full py-4 px-6 rounded-xl font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white shadow-emerald-200/50 shadow-lg"
            >
              Generate {type}
            </button>
            
            {/* Print Button - Only show after generation */}
            {lastGeneratedUrl && (
              <button
                onClick={handlePrint}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print {type}
              </button>
            )}
          </div>
        </div>

        {/* Generated List */}
        {generated.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Recently Generated:</h3>
            <div className="grid gap-4">
              {generated.map((doc, i) => (
                <div key={i} className="p-6 bg-white dark:bg-black/20 border rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{doc.companyName}</span>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                      {doc.trackingNumber}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.type} • Status: {doc.status} • Origin: {doc.origin || 'N/A'} → Destination: {doc.destination || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
