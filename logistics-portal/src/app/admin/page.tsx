"use client";
import Image from "next/image";
// Helper to get currency symbol (must be outside the React component)
function getCurrencySymbol(cur: string) {
  switch (cur) {
    case 'USD': return '$';
    case 'EUR': return 'EUR ';
    case 'GBP': return 'GBP ';
    case 'CHF': return 'CHF ';
    case 'SEK': return 'kr ';
    case 'NOK': return 'kr ';
    case 'DKK': return 'kr ';
    case 'PLN': return 'PLN ';
    case 'CZK': return 'CZK ';
    case 'JPY': return 'JPY ';
    case 'CNY': return 'CNY ';
    case 'INR': return 'INR ';
    case 'KRW': return 'KRW ';
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
import { useState, useRef, useEffect, useCallback } from "react";
// Local ReceiptItem type (not exported from types.ts)
type ReceiptItem = { description: string; quantity: number; unitPrice?: number; total?: number };
type PaymentMethod = 'Cash' | 'Bank Transfer' | 'POS' | 'Credit Card'
type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK'
  | 'JPY' | 'CNY' | 'INR' | 'KRW' | 'SGD' | 'HKD' | 'CAD' | 'MXN' | 'BRL'
  | 'ARS' | 'CLP' | 'PHP'
const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['Cash', 'Bank Transfer', 'POS', 'Credit Card']
const CURRENCY_OPTIONS: CurrencyCode[] = [
  'USD', 'EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
  'JPY', 'CNY', 'INR', 'KRW', 'SGD', 'HKD', 'CAD', 'MXN', 'BRL',
  'ARS', 'CLP', 'PHP',
]
import type { DocumentConfig } from "@/lib/types";
import { GREENHILLS_CONFIG, SKYSHIP_CONFIG, generateTrackingId } from "@/lib/constants";
import { generateDocumentPDF } from "@/components/DocumentTemplate";
import SmartWaybillForm from "@/components/SmartWaybillForm";
import AdminTimelineControlPanel from "@/components/AdminTimelineControlPanel";
import { buildStoredWaybillFromFormData, createWaybill, getWaybillErrorMessage } from "@/services/waybillService";

const ADMIN_AUTH_KEY = 'skyship_admin_auth'
const FALLBACK_ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? 'Dragon404'
const FALLBACK_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '56920lK'
const LAST_RECEIPT_DOC_STORAGE_KEY = 'skyship_last_receipt_doc'

function asSafeText(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || fallback
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    const trimmed = String(value).trim()
    return trimmed || fallback
  }
  return fallback
}

function asOptionalText(value: unknown): string {
  return asSafeText(value, '')
}

function formatPrintCurrency(currency: DocumentConfig['currency'], amount: number): string {
  const symbol = getCurrencySymbol(currency || 'USD')
  return `${symbol}${amount.toFixed(2)}`
}

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) || touchMac
}

interface ReceiptPrintViewProps {
  data: DocumentConfig
  pdfUrl?: string | null
  onBack: () => void
}

function ReceiptPrintView({ data, pdfUrl, onBack }: ReceiptPrintViewProps) {
  const companyName = asSafeText(data.companyName, 'Company Name')
  const companyAddress = asSafeText(data.companyAddress, 'Not provided')
  const companyPhone = asSafeText(data.companyPhone, 'Not provided')
  const companyEmail = asSafeText(data.companyEmail, 'Not provided')
  const customerName = asSafeText(data.customerName, 'Customer Name')
  const customerAddress = asSafeText(data.customerAddress, 'Customer Address')
  const receiptNumber = asSafeText(data.receiptNumber, data.trackingNumber || 'N/A')
  const issueDate = asSafeText(data.dateOfIssue, new Date().toISOString().split('T')[0])
  const paymentMethod = asSafeText(data.paymentMethod, 'Not provided')
  const transferMode = asSafeText(data.transferMode, 'Not provided')
  const notes = asSafeText(data.notes, 'Payment is due as agreed. Please include receipt number on all payments.')
  const memo = asSafeText(data.receiptDescription || data.description, '-')
  const signeeName = asSafeText(data.signeeName, 'Authorized Signatory')
  const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0
  const paid = typeof data.paid === 'number' ? data.paid : 0
  const items = Array.isArray(data.items) ? data.items : []

  const rows = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.price) || 0
    const total = quantity * unitPrice
    return { id: `${index}-${item.description}`, description: asSafeText(item.description, '-'), quantity, unitPrice, total }
  })
  const subtotal = rows.reduce((sum, row) => sum + row.total, 0)

  const tax = subtotal * (taxRate / 100)
  const grandTotal = subtotal + tax
  const balance = grandTotal - paid

  const handlePrintTap = useCallback(() => {
    try {
      if (typeof window.print === 'function') {
        let afterPrintFired = false
        const onAfterPrint = () => {
          afterPrintFired = true
        }
        window.addEventListener('afterprint', onAfterPrint, { once: true })
        window.print()

        if (isMobileBrowser()) {
          window.setTimeout(() => {
            if (!afterPrintFired) {
              alert('If print dialog did not open, tap Open PDF Copy and use your browser menu to print.')
            }
          }, 1200)
        }
        return
      }
    } catch (error) {
      console.error('Native print failed:', error)
    }

    if (pdfUrl) {
      window.location.href = pdfUrl
      return
    }

    alert('Printing is not available in this browser. Open this page in Safari or Chrome and use Share > Print.')
  }, [pdfUrl])

  return (
    <div className="receipt-print-shell min-h-screen bg-[#f3f7fb] px-2 py-3 sm:px-4 sm:py-4">
      <style jsx global>{`
        @media print {
          .receipt-print-shell {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .receipt-print-actions {
            display: none !important;
          }
          .receipt-print-card {
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            max-width: none !important;
          }
        }
      `}</style>

      <article className="receipt-print-card mx-auto w-full max-w-[430px] rounded-xl border border-[#d4deea] bg-white p-3 sm:p-4">
        <header className="border-b border-[#d4deea] pb-2">
          <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Company</p>
          <h1 className="text-xl font-semibold tracking-wide text-[#10243b]">{companyName}</h1>
          <p className="mt-1 text-xs text-[#45607f] whitespace-pre-wrap break-words">{companyAddress}</p>
          <p className="text-xs text-[#45607f] break-words">{companyPhone} | {companyEmail}</p>
        </header>

        <section className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Receipt Number</p>
            <p className="text-sm font-semibold text-[#10243b]">{receiptNumber}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Issue Date</p>
            <p className="text-sm font-semibold text-[#10243b]">{issueDate}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Payment Method</p>
            <p className="text-sm font-semibold text-[#10243b]">{paymentMethod}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Transfer Mode</p>
            <p className="text-sm font-semibold text-[#10243b]">{transferMode}</p>
          </div>
        </section>

        <section className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Bill To</p>
          <p className="text-sm font-semibold text-[#10243b]">{customerName}</p>
          <p className="text-xs text-[#45607f] whitespace-pre-wrap break-words">{customerAddress}</p>
        </section>

        <section className="mt-3 overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-[46%] border border-[#d4deea] bg-[#e8f0fa] px-1 py-1 text-left uppercase text-[#304b67]">Description</th>
                <th className="w-[14%] border border-[#d4deea] bg-[#e8f0fa] px-1 py-1 text-right uppercase text-[#304b67]">Qty</th>
                <th className="w-[20%] border border-[#d4deea] bg-[#e8f0fa] px-1 py-1 text-right uppercase text-[#304b67]">Unit</th>
                <th className="w-[20%] border border-[#d4deea] bg-[#e8f0fa] px-1 py-1 text-right uppercase text-[#304b67]">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-[#d4deea] px-1 py-1 break-words text-[#10243b]">{row.description}</td>
                    <td className="border border-[#d4deea] px-1 py-1 text-right text-[#10243b]">{row.quantity}</td>
                    <td className="border border-[#d4deea] px-1 py-1 text-right text-[#10243b]">{formatPrintCurrency(data.currency, row.unitPrice)}</td>
                    <td className="border border-[#d4deea] px-1 py-1 text-right text-[#10243b]">{formatPrintCurrency(data.currency, row.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-[#d4deea] px-1 py-2 text-center text-[#45607f]">
                    No line items available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-3 rounded-lg border border-[#d4deea] p-2 text-sm text-[#10243b]">
          <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatPrintCurrency(data.currency, subtotal)}</span></div>
          <div className="mt-1 flex items-center justify-between"><span>VAT ({taxRate}%)</span><span>{formatPrintCurrency(data.currency, tax)}</span></div>
          <div className="mt-1 flex items-center justify-between"><span>Paid</span><span>{formatPrintCurrency(data.currency, paid)}</span></div>
          <div className="mt-1 flex items-center justify-between"><span>Balance</span><span>{formatPrintCurrency(data.currency, balance)}</span></div>
          <div className="mt-1 flex items-center justify-between font-semibold"><span>Grand Total</span><span>{formatPrintCurrency(data.currency, grandTotal)}</span></div>
        </section>

        <section className="mt-3 text-xs text-[#45607f]">
          <p className="text-[11px] uppercase tracking-wide text-[#4c6380]">Notes</p>
          <p className="whitespace-pre-wrap break-words">{notes}</p>
          <p className="mt-2 text-[11px] uppercase tracking-wide text-[#4c6380]">Memo</p>
          <p className="whitespace-pre-wrap break-words">{memo}</p>
        </section>

        <p className="mt-3 border-t border-dashed border-[#b8c7da] pt-2 text-xs text-[#314a67]">
          Authorized Signatory: {signeeName}
        </p>
      </article>

      <div className="receipt-print-actions mx-auto mt-3 flex w-full max-w-[430px] flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handlePrintTap}
          className="w-full rounded-lg bg-[#1f4c7a] px-4 py-3 text-sm font-semibold text-white"
        >
          Print Receipt
        </button>
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-lg bg-[#35597f] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Open PDF Copy
          </a>
        )}
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg bg-[#586b85] px-4 py-3 text-sm font-semibold text-white"
        >
          Back to App
        </button>
      </div>

      <p className="mx-auto mt-2 w-full max-w-[430px] text-xs text-[#4c6380]">
        iPhone/Safari: if dialog does not show immediately, tap <strong>Print Receipt</strong> again.
      </p>
    </div>
  )
}

export default function AdminPage() {
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const canUseFallbackCredentials = useCallback((username: string, password: string) => {
    return username.trim() === FALLBACK_ADMIN_USERNAME && password === FALLBACK_ADMIN_PASSWORD
  }, [])
  const completeLogin = useCallback(() => {
    setIsAuthenticated(true)
    setLoginError('')
    setLoginPassword('')

    try {
      window.sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
    } catch {
      // Login still works even if session storage is blocked.
    }
  }, [])

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(ADMIN_AUTH_KEY)
      if (stored === 'true') {
        setIsAuthenticated(true)
      }
    } catch {
      // Ignore storage availability issues and continue with login form.
    }
    setIsAuthReady(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedUsername = loginUsername.trim()
    const enteredPassword = loginPassword

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: normalizedUsername, password: enteredPassword }),
      })

      if (!response.ok) {
        if (canUseFallbackCredentials(normalizedUsername, enteredPassword)) {
          completeLogin()
          return
        }
        setLoginError('Invalid username or password')
        return
      }
      completeLogin()
    } catch {
      if (canUseFallbackCredentials(normalizedUsername, enteredPassword)) {
        completeLogin()
        return
      }
      setLoginError('Unable to login right now. Please try again.')
    }
  }

  const handleLogout = () => {
    try {
      window.sessionStorage.removeItem(ADMIN_AUTH_KEY)
    } catch {
      // Ignore storage availability issues during logout.
    }
    setIsAuthenticated(false)
    setLoginUsername('')
    setLoginPassword('')
    setLoginError('')
  }

  const [type, setType] = useState<'RECEIPT' | 'WAYBILL'>('RECEIPT')
  const [companyName, setCompanyName] = useState(asSafeText(GREENHILLS_CONFIG.name, 'Company Name'))
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [companyAddress, setCompanyAddress] = useState<string>(asOptionalText(GREENHILLS_CONFIG.address))
  const [companyPhone, setCompanyPhone] = useState<string>(asOptionalText(GREENHILLS_CONFIG.phone))
  const [companyEmail, setCompanyEmail] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [origin] = useState('')
  const [destination] = useState('')
  const [taxRate, setTaxRate] = useState(16)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [paid, setPaid] = useState(0);
  const [balance, setBalance] = useState(0);
  const [generated, setGenerated] = useState<DocumentConfig[]>([])
  const [isWaybillSaving, setIsWaybillSaving] = useState(false)
  const [waybillSaveError, setWaybillSaveError] = useState<string | null>(null)
  const [waybillSaveSuccess, setWaybillSaveSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // New professional fields
  const [receiptNumber, setReceiptNumber] = useState('')
  const [dateOfIssue, setDateOfIssue] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [receiptDescription, setReceiptDescription] = useState('')
  const [signeeName, setSigneeName] = useState('J. Mitchell')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [stampUrl, setStampUrl] = useState('')
  const [stampPreview, setStampPreview] = useState<string | null>(null)
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null) // NEW: Store last PDF URL for printing
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<DocumentConfig | null>(null)
  const [printViewDoc, setPrintViewDoc] = useState<DocumentConfig | null>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const stampInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_RECEIPT_DOC_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as DocumentConfig
      if (parsed?.type === 'RECEIPT') {
        setLastGeneratedDoc(parsed)
      }
    } catch {
      // Ignore storage parsing issues.
    }
  }, [])

  useEffect(() => {
    try {
      if (!lastGeneratedDoc || lastGeneratedDoc.type !== 'RECEIPT') {
        window.sessionStorage.removeItem(LAST_RECEIPT_DOC_STORAGE_KEY)
        return
      }
      window.sessionStorage.setItem(LAST_RECEIPT_DOC_STORAGE_KEY, JSON.stringify(lastGeneratedDoc))
    } catch {
      // Ignore storage write issues.
    }
  }, [lastGeneratedDoc])

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {description: '', quantity: 0, unitPrice: 0, total: 0}])
  }, [])

  const updateItem = useCallback((index: number, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
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

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file for the signature.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Signature file size must be less than 3MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setSignatureUrl(base64)
      setSignaturePreview(base64)
    }
    reader.onerror = () => {
      alert('Error reading signature file. Please try again.')
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

  const handleStampUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file for the stamp.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Stamp file size must be less than 3MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setStampUrl(base64)
      setStampPreview(base64)
    }
    reader.onerror = () => {
      alert('Error reading stamp file. Please try again.')
    }
    reader.readAsDataURL(file)
  }, [])

  const clearStamp = useCallback(() => {
    setStampUrl('')
    setStampPreview(null)
    if (stampInputRef.current) {
      stampInputRef.current.value = ''
    }
  }, [])

  const toggleType = (newType: 'RECEIPT' | 'WAYBILL') => {
    setType(newType)
    if (newType === 'RECEIPT') {
      setCompanyName(asSafeText(GREENHILLS_CONFIG.name, 'Company Name'))
      setLogoUrl(asOptionalText(GREENHILLS_CONFIG.logo))
      setLogoPreview(null)
      setCompanyAddress(asOptionalText(GREENHILLS_CONFIG.address))
      setCompanyPhone(asOptionalText(GREENHILLS_CONFIG.phone))
      setCompanyEmail((prev) => asOptionalText(prev))
    } else {
      setCompanyName(asSafeText(SKYSHIP_CONFIG.name, 'Company Name'))
      setLogoUrl(asOptionalText(SKYSHIP_CONFIG.logo))
      setLogoPreview(null)
    }
  }

  const buildReceiptDocument = useCallback((trackingNumber?: string): DocumentConfig => {
    const safeTrackingNumber = asSafeText(trackingNumber, generateTrackingId())
    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      const total = Number(item.total)

      return {
        description: asOptionalText(item.description),
        quantity,
        unitPrice,
        total: Number.isFinite(total) ? total : quantity * unitPrice,
        price: unitPrice,
      }
    })

    return {
      companyName: asSafeText(companyName, 'Company Name'),
      logoUrl: asOptionalText(logoUrl),
      type: 'RECEIPT',
      items: normalizedItems,
      origin: asOptionalText(origin),
      destination: asOptionalText(destination),
      trackingNumber: safeTrackingNumber,
      status: 'PENDING',
      receiptNumber: asSafeText(receiptNumber, safeTrackingNumber),
      dateOfIssue: asSafeText(dateOfIssue, new Date().toISOString().split('T')[0]),
      paymentMethod,
      currency,
      companyAddress: asOptionalText(companyAddress),
      companyPhone: asOptionalText(companyPhone),
      companyEmail: asOptionalText(companyEmail),
      customerName: asOptionalText(customerName),
      customerAddress: asOptionalText(customerAddress),
      taxRate: Number(taxRate) || 0,
      paid: Number(paid) || 0,
      balance: Number(balance) || 0,
      description: asOptionalText(receiptDescription),
      receiptDescription: asOptionalText(receiptDescription),
      signeeName: asSafeText(signeeName, 'Authorized Signatory'),
      signatureUrl: asOptionalText(signatureUrl),
      stampUrl: asOptionalText(stampUrl),
    }
  }, [
    balance,
    companyAddress,
    companyEmail,
    companyName,
    companyPhone,
    currency,
    customerAddress,
    customerName,
    dateOfIssue,
    destination,
    items,
    logoUrl,
    origin,
    paid,
    paymentMethod,
    receiptDescription,
    receiptNumber,
    signeeName,
    signatureUrl,
    stampUrl,
    taxRate,
  ])

  const generate = async () => {
    try {
      const trackingNumber = generateTrackingId()
      const doc: DocumentConfig = type === 'RECEIPT'
        ? buildReceiptDocument(trackingNumber)
        : {
            companyName,
            logoUrl: logoUrl || '',
            type,
            items: items.map(item => ({ ...item, price: item.unitPrice })),
            origin,
            destination,
            trackingNumber,
            status: 'PENDING',
            receiptNumber: receiptNumber || trackingNumber,
            dateOfIssue: dateOfIssue || new Date().toISOString().split('T')[0],
            paymentMethod,
            currency,
            companyAddress: companyAddress || '',
            companyPhone: companyPhone || '',
            companyEmail: companyEmail || '',
            customerName: customerName || '',
            customerAddress: customerAddress || '',
            taxRate: taxRate || 0,
            paid,
            balance,
            description: receiptDescription || '',
            receiptDescription: receiptDescription || '',
            signeeName: signeeName || 'Authorized Signatory',
            signatureUrl: signatureUrl || '',
            stampUrl: stampUrl || '',
          }

      // Prepare receipt for print regardless of PDF behavior on the device.
      setLastGeneratedDoc(doc)
      setGenerated(prev => [doc, ...prev.slice(0, 4)])

      try {
        console.log('Generating PDF with data:', doc)
        const pdfUrl = await generateDocumentPDF(doc)
        console.log('PDF generated successfully:', pdfUrl)

        setLastGeneratedUrl(pdfUrl)

        // Forced auto-download is unreliable on many phones and can disrupt state.
        if (!isMobileBrowser()) {
          const link = document.createElement('a')
          link.href = pdfUrl
          link.download = `${type.toLowerCase()}_${trackingNumber}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }

        alert(`${type} generated successfully!`)
      } catch (pdfError) {
        console.error('PDF generation warning:', pdfError)
        setLastGeneratedUrl(null)
        alert(`${type} prepared for printing. PDF copy is unavailable on this device/browser.`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Error generating ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // NEW: Print function
  const handlePrint = () => {
    const hasLiveReceiptDraft = type === 'RECEIPT' && items.length > 0
    const draftDoc = hasLiveReceiptDraft ? buildReceiptDocument(lastGeneratedDoc?.trackingNumber) : null
    const targetDoc = draftDoc || lastGeneratedDoc

    if (!targetDoc || targetDoc.type !== 'RECEIPT') {
      alert('Add at least one item and generate or prepare a receipt before printing.')
      return
    }

    if (draftDoc) {
      setLastGeneratedDoc(draftDoc)
    }
    setPrintViewDoc(targetDoc)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.total || (item.quantity * (item.unitPrice || 0))), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  useEffect(() => {
    setBalance(total - paid);
  }, [total, paid]);

  if (!isAuthReady) {
    return (
      <div className="admin-polish min-h-screen flex items-center justify-center px-4">
        <div className="admin-muted text-sm">Loading admin access...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-polish min-h-screen flex items-center justify-center px-4 py-10">
        <div className="admin-login-card w-full max-w-md p-6 sm:p-8">
          <h1 className="admin-page-title text-2xl sm:text-3xl font-bold">Admin Login</h1>
          <p className="admin-subtitle text-sm mt-2">Sign in to access the admin dashboard.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full logistics-input-control px-4 py-3"
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
                className="w-full logistics-input-control px-4 py-3"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {loginError && <p className="text-red-300 text-sm">{loginError}</p>}

            <button
              type="submit"
              className="admin-action-primary w-full rounded-xl py-3 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (printViewDoc) {
    return <ReceiptPrintView data={printViewDoc} pdfUrl={lastGeneratedUrl} onBack={() => setPrintViewDoc(null)} />
  }

  return (
    <div className="admin-polish flex min-h-full flex-col items-center justify-start py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl space-y-8">
        <div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="admin-heading text-3xl sm:text-4xl font-bold tracking-tight">
              Admin Dashboard
            </h2>
            <button
              type="button"
              onClick={handleLogout}
              className="admin-action-secondary self-start sm:self-auto px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
          <p className="admin-subtitle mt-1 text-sm">
            Create receipt or waybill
          </p>
        </div>

        <div className="admin-main-card p-4 sm:p-6 lg:p-8">
          {/* Toggle */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => toggleType('RECEIPT')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  type === 'RECEIPT'
                    ? 'admin-action-secondary text-white shadow-lg'
                    : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                }`}
              >
                Receipt
              </button>
              <button
                onClick={() => toggleType('WAYBILL')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  type === 'WAYBILL'
                    ? 'admin-action-primary text-[#0a2138] shadow-lg'
                    : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                }`}
              >
                Waybill
              </button>
            </div>
            
          </div>

          {/* Company Info */}
          {type === 'RECEIPT' && (
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
                    <Image 
                      src={logoPreview} 
                      alt="Logo preview" 
                      fill
                      unoptimized
                      sizes="96px"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={clearLogo}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      title="Remove logo"
                    >
                      X
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
              <textarea
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white"
                placeholder="Enter full company address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Phone
              </label>
              <input
                type="tel"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white"
                placeholder="Enter company contact number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Email
              </label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-black/50 text-gray-900 dark:text-white"
                placeholder="Enter company email"
              />
            </div>
          </div>
          )}

          {/* RECEIPT MODE: Receipt Settings - Glassmorphism Style */}
          {type === 'RECEIPT' && (
            <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">RCPT</span>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description / Memo
                  </label>
                  <textarea
                    value={receiptDescription}
                    onChange={(e) => setReceiptDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm resize-none"
                    placeholder="Enter description or memo for the receipt output"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'RECEIPT' && (
            <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 text-[10px] font-bold">SIGN</span>
                Sign-off & Stamp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signee Name
                  </label>
                  <input
                    type="text"
                    value={signeeName}
                    onChange={(e) => setSigneeName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition backdrop-blur-sm"
                    placeholder="e.g., J. Mitchell"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Signature (Optional)
                  </label>
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {signaturePreview && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-white">
                        <Image
                          src={signaturePreview}
                          alt="Signature preview"
                          fill
                          unoptimized
                          sizes="80px"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        onClick={clearSignature}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg bg-white"
                      >
                        Remove Signature
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Stamp (Optional)
                  </label>
                  <input
                    ref={stampInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-black/30 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {stampPreview && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-white">
                        <Image
                          src={stampPreview}
                          alt="Stamp preview"
                          fill
                          unoptimized
                          sizes="80px"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        onClick={clearStamp}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg bg-white"
                      >
                        Remove Stamp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RECEIPT MODE: Payment Details - Glassmorphism Style */}
          {type === 'RECEIPT' && (
            <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-[10px] font-bold">PAY</span>
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      const value = e.target.value as PaymentMethod
                      if (PAYMENT_METHOD_OPTIONS.includes(value)) {
                        setPaymentMethod(value)
                      }
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value as CurrencyCode
                      if (CURRENCY_OPTIONS.includes(value)) {
                        setCurrency(value)
                      }
                    }}
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
          {type === 'RECEIPT' && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Customer
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
          )}

          {/* WAYBILL MODE: Smart Waybill Form */}
          {type === 'WAYBILL' && (
            <div className="mb-8">
              <SmartWaybillForm
                onGenerated={async (_pdfUrl, waybillData) => {
                  setIsWaybillSaving(true)
                  setWaybillSaveError(null)
                  setWaybillSaveSuccess(null)
                  try {
                    const waybillDoc = buildStoredWaybillFromFormData(waybillData);
                    await createWaybill(waybillDoc);
                    setWaybillSaveSuccess(`Waybill ${waybillDoc.waybillNumber} saved successfully.`);
                  } catch (err) {
                    console.error(err);
                    const message = getWaybillErrorMessage(err, 'waybill save')
                    setWaybillSaveError(message)
                    throw new Error(message)
                  } finally {
                    setIsWaybillSaving(false)
                  }
                }}
              />
              {isWaybillSaving && (
                <p className="mt-3 text-sm text-[#9DC400]">Saving waybill to server...</p>
              )}
              {waybillSaveSuccess && (
                <p className="mt-3 text-sm text-emerald-300">{waybillSaveSuccess}</p>
              )}
              {waybillSaveError && (
                <div className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {waybillSaveError}
                </div>
              )}
              <AdminTimelineControlPanel />
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
                  className="admin-action-secondary px-4 py-2 rounded-xl transition"
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
              type="button"
              onClick={generate}
              disabled={items.length === 0}
              className="admin-action-primary w-full py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Generate {type}
            </button>
            
            {/* Print Button - supports current draft and generated receipts */}
            {type === 'RECEIPT' && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={items.length === 0 && lastGeneratedDoc?.type !== 'RECEIPT'}
                className="admin-action-secondary w-full py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
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
                    {doc.type} | Status: {doc.status} | Origin: {doc.origin || 'N/A'} -&gt; Destination: {doc.destination || 'N/A'}
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
