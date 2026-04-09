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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function asSafeText(value: string | undefined, fallback: string): string {
  const trimmed = (value || '').trim()
  return trimmed || fallback
}

function asSafeHtml(value: string | undefined, fallback: string): string {
  return escapeHtml(asSafeText(value, fallback)).replace(/\n/g, '<br />')
}

function formatPrintCurrency(currency: DocumentConfig['currency'], amount: number): string {
  const symbol = getCurrencySymbol(currency || 'USD')
  return `${symbol}${amount.toFixed(2)}`
}

function buildMobileReceiptPrintHtml(data: DocumentConfig): string {
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

  let subtotal = 0
  const itemRows = items.length
    ? items
        .map((item) => {
          const quantity = Number(item.quantity) || 0
          const unitPrice = Number(item.price) || 0
          const total = quantity * unitPrice
          subtotal += total
          return `
            <tr>
              <td>${escapeHtml(asSafeText(item.description, '-'))}</td>
              <td class="num">${quantity}</td>
              <td class="num">${formatPrintCurrency(data.currency, unitPrice)}</td>
              <td class="num">${formatPrintCurrency(data.currency, total)}</td>
            </tr>
          `
        })
        .join('')
    : '<tr><td colspan="4">No line items available.</td></tr>'

  const tax = subtotal * (taxRate / 100)
  const grandTotal = subtotal + tax
  const balance = grandTotal - paid

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Receipt ${escapeHtml(receiptNumber)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { width: 100%; overflow-x: visible; }
    body {
      margin: 0;
      padding: 12px;
      background: #f3f7fb;
      color: #10243b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt {
      width: 100%;
      max-width: 430px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d4deea;
      border-radius: 12px;
      padding: 14px;
    }
    .header { border-bottom: 1px solid #d4deea; padding-bottom: 10px; margin-bottom: 10px; }
    .title { margin: 0; font-size: 20px; letter-spacing: 0.04em; }
    .meta, .section { margin-top: 10px; }
    .meta-grid, .section-grid { display: grid; gap: 6px; }
    .meta-grid { grid-template-columns: 1fr 1fr; }
    .label { font-size: 11px; text-transform: uppercase; color: #4c6380; letter-spacing: 0.04em; }
    .value { font-size: 13px; font-weight: 600; color: #10243b; word-break: break-word; }
    .muted { font-size: 12px; color: #45607f; line-height: 1.45; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; table-layout: fixed; }
    th, td { border: 1px solid #d4deea; padding: 6px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #e8f0fa; font-size: 11px; text-transform: uppercase; color: #304b67; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 10px; border: 1px solid #d4deea; border-radius: 10px; padding: 8px; }
    .totals-row { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; margin-top: 4px; }
    .totals-row:first-child { margin-top: 0; }
    .totals-row strong { font-size: 14px; }
    .sign { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #b8c7da; font-size: 12px; color: #314a67; }
    .print-controls { margin: 14px auto 0; max-width: 430px; display: flex; gap: 8px; }
    .print-controls button {
      flex: 1;
      border: 0;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      background: #1f4c7a;
    }
    .print-controls button.secondary { background: #586b85; }
    @media screen and (max-width: 480px) {
      body { padding: 8px; }
      .receipt { padding: 12px; border-radius: 10px; }
      .meta-grid { grid-template-columns: 1fr; }
      th, td { padding: 5px; font-size: 11px; }
      .title { font-size: 18px; }
    }
    @page { size: auto; margin: 10mm; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .receipt {
        max-width: none;
        border: 0;
        border-radius: 0;
        padding: 0;
      }
      .print-controls { display: none !important; }
      table, tr, td, th, .totals, .section { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <article class="receipt">
    <header class="header">
      <p class="label">Company</p>
      <h1 class="title">${escapeHtml(companyName)}</h1>
      <p class="muted">${asSafeHtml(companyAddress, 'Not provided')}</p>
      <p class="muted">${escapeHtml(companyPhone)} | ${escapeHtml(companyEmail)}</p>
    </header>

    <section class="meta">
      <div class="meta-grid">
        <div>
          <p class="label">Receipt Number</p>
          <p class="value">${escapeHtml(receiptNumber)}</p>
        </div>
        <div>
          <p class="label">Issue Date</p>
          <p class="value">${escapeHtml(issueDate)}</p>
        </div>
        <div>
          <p class="label">Payment Method</p>
          <p class="value">${escapeHtml(paymentMethod)}</p>
        </div>
        <div>
          <p class="label">Transfer Mode</p>
          <p class="value">${escapeHtml(transferMode)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <p class="label">Bill To</p>
      <p class="value">${escapeHtml(customerName)}</p>
      <p class="muted">${asSafeHtml(customerAddress, 'Customer Address')}</p>
    </section>

    <section class="section">
      <table aria-label="Receipt Items">
        <thead>
          <tr>
            <th style="width: 46%;">Description</th>
            <th style="width: 14%;" class="num">Qty</th>
            <th style="width: 20%;" class="num">Unit</th>
            <th style="width: 20%;" class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </section>

    <section class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${formatPrintCurrency(data.currency, subtotal)}</span></div>
      <div class="totals-row"><span>VAT (${taxRate}%)</span><span>${formatPrintCurrency(data.currency, tax)}</span></div>
      <div class="totals-row"><span>Paid</span><span>${formatPrintCurrency(data.currency, paid)}</span></div>
      <div class="totals-row"><span>Balance</span><span>${formatPrintCurrency(data.currency, balance)}</span></div>
      <div class="totals-row"><strong>Grand Total</strong><strong>${formatPrintCurrency(data.currency, grandTotal)}</strong></div>
    </section>

    <section class="section">
      <p class="label">Notes</p>
      <p class="muted">${asSafeHtml(notes, '-')}</p>
      <p class="label" style="margin-top: 8px;">Memo</p>
      <p class="muted">${asSafeHtml(memo, '-')}</p>
    </section>

    <p class="sign">Authorized Signatory: ${escapeHtml(signeeName)}</p>
  </article>

  <div class="print-controls">
    <button type="button" onclick="window.print()">Print Receipt</button>
    <button type="button" class="secondary" onclick="window.close()">Close</button>
  </div>

  <script>
    (function () {
      var trigger = function () {
        window.setTimeout(function () {
          window.focus();
          window.print();
        }, 180);
      };

      if (document.readyState === 'complete') {
        trigger();
      } else {
        window.addEventListener('load', trigger, { once: true });
      }
    })();
  </script>
</body>
</html>`
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
  const [companyName, setCompanyName] = useState('Greenhills Chemical Incorporation')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [companyAddress, setCompanyAddress] = useState<string>(GREENHILLS_CONFIG.address)
  const [companyPhone, setCompanyPhone] = useState<string>(GREENHILLS_CONFIG.phone)
  const [companyEmail, setCompanyEmail] = useState<string>('billing@greenhills.com')
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
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const stampInputRef = useRef<HTMLInputElement>(null)

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
      setCompanyName(GREENHILLS_CONFIG.name)
      setLogoUrl(GREENHILLS_CONFIG.logo)
      setLogoPreview(null)
      setCompanyAddress(GREENHILLS_CONFIG.address)
      setCompanyPhone(GREENHILLS_CONFIG.phone)
      setCompanyEmail('billing@greenhills.com')
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

      console.log('Generating PDF with data:', doc)
      const pdfUrl = await generateDocumentPDF(doc)
      console.log('PDF generated successfully:', pdfUrl)
      
      // Store URL for printing
      setLastGeneratedUrl(pdfUrl)
      setLastGeneratedDoc(doc)
      
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
    if (!lastGeneratedDoc || lastGeneratedDoc.type !== 'RECEIPT') {
      alert('Please generate a receipt first before printing.')
      return
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) {
      if (lastGeneratedUrl) {
        window.open(lastGeneratedUrl, '_blank', 'noopener,noreferrer')
      } else {
        alert('Unable to open print window. Please allow pop-ups and try again.')
      }
      return
    }

    const printMarkup = buildMobileReceiptPrintHtml(lastGeneratedDoc)
    printWindow.document.open()
    printWindow.document.write(printMarkup)
    printWindow.document.close()
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
              onClick={generate}
              disabled={items.length === 0}
              className="admin-action-primary w-full py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Generate {type}
            </button>
            
            {/* Print Button - Only show after generation */}
            {lastGeneratedDoc?.type === 'RECEIPT' && (
              <button
                onClick={handlePrint}
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
