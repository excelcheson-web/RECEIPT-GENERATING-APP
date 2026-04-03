'use client'

import { useEffect } from 'react'
import jsPDF from 'jspdf'
import type { DocumentConfig } from '@/lib/types'

interface Props {
  data: DocumentConfig
  onComplete?: (pdfUrl: string) => void
}

type Rgb = [number, number, number]

interface BrandTheme {
  primary: Rgb
  secondary: Rgb
  accent: Rgb
  border: Rgb
  text: Rgb
  muted: Rgb
  paper: Rgb
}

const DEFAULT_THEME: BrandTheme = {
  primary: [33, 102, 160],
  secondary: [14, 42, 71],
  accent: [226, 236, 245],
  border: [170, 191, 211],
  text: [14, 42, 71],
  muted: [84, 105, 124],
  paper: [249, 251, 253],
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function mixRgb(a: Rgb, b: Rgb, ratio: number): Rgb {
  const r = clampChannel(a[0] + (b[0] - a[0]) * ratio)
  const g = clampChannel(a[1] + (b[1] - a[1]) * ratio)
  const bVal = clampChannel(a[2] + (b[2] - a[2]) * ratio)
  return [r, g, bVal]
}

function darken(color: Rgb, ratio: number): Rgb {
  return mixRgb(color, [0, 0, 0], ratio)
}

function lighten(color: Rgb, ratio: number): Rgb {
  return mixRgb(color, [255, 255, 255], ratio)
}

function luminance([r, g, b]: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function applyTextColor(pdf: jsPDF, color: Rgb) {
  pdf.setTextColor(color[0], color[1], color[2])
}

function applyFillColor(pdf: jsPDF, color: Rgb) {
  pdf.setFillColor(color[0], color[1], color[2])
}

function applyDrawColor(pdf: jsPDF, color: Rgb) {
  pdf.setDrawColor(color[0], color[1], color[2])
}

async function loadImageAsDataUrl(imagePath: string): Promise<string | null> {
  if (!imagePath) return null
  if (imagePath.startsWith('data:image')) return imagePath

  try {
    const response = await fetch(imagePath)
    if (!response.ok) return null
    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Could not read image blob'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function createWatermarkImage(imagePath: string, opacity: number): Promise<string | null> {
  const source = await loadImageAsDataUrl(imagePath)
  if (!source) return null

  return await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = opacity
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = source
  })
}

async function deriveThemeFromLogo(logoPath: string | undefined): Promise<BrandTheme> {
  if (!logoPath) return DEFAULT_THEME
  const source = await loadImageAsDataUrl(logoPath)
  if (!source) return DEFAULT_THEME

  const sampled = await new Promise<Rgb | null>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 56
      canvas.height = 56
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data

      const buckets = new Map<string, { count: number; r: number; g: number; b: number; sat: number }>()
      for (let i = 0; i < imageData.length; i += 4) {
        const alpha = imageData[i + 3]
        if (alpha < 180) continue

        const r = imageData[i]
        const g = imageData[i + 1]
        const b = imageData[i + 2]

        if (r > 245 && g > 245 && b > 245) continue
        if (r < 18 && g < 18 && b < 18) continue

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const sat = max === 0 ? 0 : (max - min) / max
        const lum = luminance([r, g, b])
        if (lum < 0.08 || lum > 0.94) continue

        const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`
        const existing = buckets.get(key)
        if (existing) {
          existing.count += 1
          existing.r += r
          existing.g += g
          existing.b += b
          existing.sat += sat
        } else {
          buckets.set(key, { count: 1, r, g, b, sat })
        }
      }

      if (buckets.size === 0) {
        resolve(null)
        return
      }

      let bestKey = ''
      let bestScore = -1
      buckets.forEach((value, key) => {
        const avgSat = value.sat / value.count
        const score = value.count * (1 + avgSat * 1.2)
        if (score > bestScore) {
          bestScore = score
          bestKey = key
        }
      })

      const selected = buckets.get(bestKey)
      if (!selected) {
        resolve(null)
        return
      }

      resolve([
        clampChannel(selected.r / selected.count),
        clampChannel(selected.g / selected.count),
        clampChannel(selected.b / selected.count),
      ])
    }
    img.onerror = () => resolve(null)
    img.src = source
  })

  if (!sampled) return DEFAULT_THEME

  const primary = sampled
  const secondary = luminance(primary) > 0.45 ? darken(primary, 0.62) : darken(primary, 0.35)
  const accent = lighten(primary, 0.8)
  const border = mixRgb(primary, secondary, 0.45)
  const paper = lighten(primary, 0.93)
  const text = darken(secondary, 0.1)
  const muted = mixRgb(text, [255, 255, 255], 0.42)

  return { primary, secondary, accent, border, paper, text, muted }
}

function getCurrencySymbol(cur: string | undefined): string {
  switch (cur) {
    case 'USD': return '$'
    case 'EUR': return 'EUR '
    case 'GBP': return 'GBP '
    case 'CHF': return 'CHF '
    case 'SEK': return 'SEK '
    case 'NOK': return 'NOK '
    case 'DKK': return 'DKK '
    case 'PLN': return 'PLN '
    case 'CZK': return 'CZK '
    case 'JPY': return 'JPY '
    case 'CNY': return 'CNY '
    case 'INR': return 'INR '
    case 'KRW': return 'KRW '
    case 'SGD': return 'SGD '
    case 'HKD': return 'HKD '
    case 'CAD': return 'CAD '
    case 'MXN': return 'MXN '
    case 'BRL': return 'BRL '
    case 'ARS': return 'ARS '
    case 'CLP': return 'CLP '
    case 'PHP': return 'PHP '
    default: return '$'
  }
}

function getCurrencyWords(cur: string | undefined): { major: string; minor: string } {
  switch (cur) {
    case 'EUR': return { major: 'Euros', minor: 'Cents' }
    case 'GBP': return { major: 'Pounds', minor: 'Pence' }
    case 'JPY': return { major: 'Yen', minor: 'Sen' }
    case 'CNY': return { major: 'Yuan', minor: 'Fen' }
    case 'INR': return { major: 'Rupees', minor: 'Paise' }
    case 'PHP': return { major: 'Pesos', minor: 'Centavos' }
    default: return { major: 'Dollars', minor: 'Cents' }
  }
}

function convertUnder100(n: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (n < 20) return ones[n]
  const tenPart = tens[Math.floor(n / 10)]
  const onePart = n % 10
  return onePart ? `${tenPart}-${ones[onePart]}` : tenPart
}

function convertUnder1000(n: number): string {
  if (n < 100) return convertUnder100(n)
  const hundreds = Math.floor(n / 100)
  const remainder = n % 100
  const base = `${convertUnder100(hundreds)} Hundred`
  return remainder ? `${base} and ${convertUnder100(remainder)}` : base
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero'

  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion']
  const parts: string[] = []
  const chunks: number[] = []
  let remaining = n
  let scaleIndex = 0

  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk > 0) {
      const chunkWords = convertUnder1000(chunk)
      const scale = scales[scaleIndex]
      parts.unshift(scale ? `${chunkWords} ${scale}` : chunkWords)
      chunks.unshift(chunk)
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex += 1
  }

  if (parts.length > 1) {
    const lastChunk = chunks[chunks.length - 1]
    if (lastChunk < 100) {
      const lead = parts.slice(0, -1).join(' ')
      const tail = parts[parts.length - 1]
      return `${lead} and ${tail}`
    }
  }

  return parts.join(' ')
}

function numberToWords(amount: number, currencyCode: string | undefined): string {
  const currencyWords = getCurrencyWords(currencyCode)
  if (!Number.isFinite(amount) || amount < 0) return `Zero ${currencyWords.major} Only`

  const major = Math.floor(amount)
  const minor = Math.round((amount - major) * 100)
  const majorWords = integerToWords(major)

  if (minor > 0) {
    return `${majorWords} ${currencyWords.major} and ${integerToWords(minor)} ${currencyWords.minor} Only`
  }
  return `${majorWords} ${currencyWords.major} Only`
}

function generateReceiptNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000)
  return `REC-${new Date().getFullYear()}-${random}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const safe = text.trim() || '-'
  return pdf.splitTextToSize(safe, maxWidth) as string[]
}

function drawPageBackground(pdf: jsPDF, theme: BrandTheme, pageWidth: number, pageHeight: number) {
  applyFillColor(pdf, theme.paper)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
}

async function generateReceiptPDF(data: DocumentConfig, onComplete?: (pdfUrl: string) => void): Promise<string> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  const theme = await deriveThemeFromLogo(data.logoUrl)

  const receiptNumber = (data.receiptNumber || generateReceiptNumber()).trim()
  const issueDate = data.dateOfIssue || formatDate(new Date())
  const companyName = (data.companyName || 'Company Name').trim()
  const companyAddress = (data.companyAddress || 'Not provided').trim() || 'Not provided'
  const companyPhone = (data.companyPhone || 'Not provided').trim() || 'Not provided'
  const companyEmail = (data.companyEmail || 'Not provided').trim() || 'Not provided'
  const customerName = (data.customerName || 'Customer Name').trim() || 'Customer Name'
  const customerAddress = (data.customerAddress || 'Customer Address').trim() || 'Customer Address'

  drawPageBackground(pdf, theme, pageWidth, pageHeight)

  const watermark = data.logoUrl ? await createWatermarkImage(data.logoUrl, 0.05) : null
  if (watermark) {
    try {
      const size = 130
      pdf.addImage(watermark, 'PNG', pageWidth / 2 - size / 2, pageHeight / 2 - size / 2, size, size)
    } catch {
      // Ignore watermark failure
    }
  }

  // Header band
  applyFillColor(pdf, theme.accent)
  pdf.rect(margin, 12, contentWidth, 24, 'F')
  applyDrawColor(pdf, theme.border)
  pdf.setLineWidth(0.4)
  pdf.rect(margin, 12, contentWidth, 24)

  const logoData = await loadImageAsDataUrl(data.logoUrl)
  if (logoData) {
    try {
      const format = logoData.includes('png') ? 'PNG' : 'JPEG'
      pdf.addImage(logoData, format, margin + 3, 14.5, 22, 19)
    } catch {
      // Ignore logo rendering failure
    }
  }

  applyTextColor(pdf, theme.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(companyName, margin + 28, 20)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  const headerContact = `${companyPhone}  |  ${companyEmail}`
  pdf.text(headerContact, margin + 28, 25)
  const addressLines = wrapText(pdf, companyAddress, contentWidth - 90)
  pdf.text(addressLines.slice(0, 2), margin + 28, 30)

  const titleColor = luminance(theme.primary) < 0.45 ? lighten(theme.primary, 0.1) : darken(theme.primary, 0.15)
  applyTextColor(pdf, titleColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.text('RECEIPT', pageWidth - margin, 23, { align: 'right' })
  pdf.setFontSize(10)
  applyTextColor(pdf, theme.text)
  pdf.text(`Receipt No: ${receiptNumber}`, pageWidth - margin, 29, { align: 'right' })
  pdf.text(`Date: ${issueDate}`, pageWidth - margin, 34, { align: 'right' })

  // Party blocks
  const blockY = 42
  const blockH = 46
  const half = contentWidth / 2
  applyDrawColor(pdf, theme.border)
  pdf.setLineWidth(0.4)
  pdf.rect(margin, blockY, contentWidth, blockH)
  pdf.line(margin + half, blockY, margin + half, blockY + blockH)

  applyFillColor(pdf, theme.secondary)
  pdf.rect(margin, blockY, half, 8, 'F')
  pdf.rect(margin + half, blockY, half, 8, 'F')
  applyTextColor(pdf, [255, 255, 255])
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FROM', margin + 4, blockY + 5.5)
  pdf.text('BILL TO', margin + half + 4, blockY + 5.5)

  const bodyTop = blockY + 12
  applyTextColor(pdf, theme.text)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('Company:', margin + 4, bodyTop)
  pdf.text('Address:', margin + 4, bodyTop + 7)
  pdf.text('Contact:', margin + 4, bodyTop + 14)
  pdf.text('Email:', margin + 4, bodyTop + 21)

  pdf.setFont('helvetica', 'normal')
  const leftTextX = margin + 24
  pdf.text(wrapText(pdf, companyName, half - 28).slice(0, 1), leftTextX, bodyTop)
  pdf.text(wrapText(pdf, companyAddress, half - 28).slice(0, 2), leftTextX, bodyTop + 7)
  pdf.text(companyPhone, leftTextX, bodyTop + 14)
  pdf.text(companyEmail, leftTextX, bodyTop + 21)

  pdf.setFont('helvetica', 'bold')
  pdf.text('Customer:', margin + half + 4, bodyTop)
  pdf.text('Address:', margin + half + 4, bodyTop + 8)
  pdf.text('Payment:', margin + half + 4, bodyTop + 16)
  pdf.text('Currency:', margin + half + 4, bodyTop + 24)
  pdf.setFont('helvetica', 'normal')
  pdf.text(wrapText(pdf, customerName, half - 28).slice(0, 1), margin + half + 24, bodyTop)
  pdf.text(wrapText(pdf, customerAddress, half - 28).slice(0, 2), margin + half + 24, bodyTop + 8)
  pdf.text(data.paymentMethod || 'Not provided', margin + half + 24, bodyTop + 16)
  pdf.text(data.currency || 'USD', margin + half + 24, bodyTop + 24)

  // Items table
  let y = 94
  const colWidths = [contentWidth * 0.5, contentWidth * 0.14, contentWidth * 0.18, contentWidth * 0.18]
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
  ]

  const drawItemsHeader = (headerY: number) => {
    applyFillColor(pdf, theme.secondary)
    pdf.rect(margin, headerY, contentWidth, 10, 'F')
    applyTextColor(pdf, [255, 255, 255])
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('Description', colX[0] + 3, headerY + 6.5)
    pdf.text('Qty', colX[1] + 3, headerY + 6.5)
    pdf.text('Unit Price', colX[2] + 3, headerY + 6.5)
    pdf.text('Total', colX[3] + 3, headerY + 6.5)
    applyDrawColor(pdf, theme.border)
    pdf.rect(margin, headerY, contentWidth, 10)
    pdf.line(colX[1], headerY, colX[1], headerY + 10)
    pdf.line(colX[2], headerY, colX[2], headerY + 10)
    pdf.line(colX[3], headerY, colX[3], headerY + 10)
  }

  drawItemsHeader(y)
  y += 10

  const currencySymbol = getCurrencySymbol(data.currency)
  const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0
  let subtotal = 0

  data.items.forEach((item, index) => {
    const itemTotal = item.quantity * (item.price || 0)
    subtotal += itemTotal

    if (y + 10 > pageHeight - 80) {
      pdf.addPage()
      drawPageBackground(pdf, theme, pageWidth, pageHeight)
      y = margin + 8
      drawItemsHeader(y)
      y += 10
    }

    if (index % 2 === 1) {
      applyFillColor(pdf, lighten(theme.accent, 0.2))
      pdf.rect(margin, y, contentWidth, 10, 'F')
    }

    applyTextColor(pdf, theme.text)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text((item.description || '').slice(0, 58), colX[0] + 3, y + 6.5)
    pdf.text(String(item.quantity), colX[1] + 3, y + 6.5)
    pdf.text(`${currencySymbol}${(item.price || 0).toFixed(2)}`, colX[2] + 3, y + 6.5)
    pdf.text(`${currencySymbol}${itemTotal.toFixed(2)}`, colX[3] + 3, y + 6.5)

    applyDrawColor(pdf, theme.border)
    pdf.rect(margin, y, contentWidth, 10)
    pdf.line(colX[1], y, colX[1], y + 10)
    pdf.line(colX[2], y, colX[2], y + 10)
    pdf.line(colX[3], y, colX[3], y + 10)
    y += 10
  })

  // Totals and amount in words
  const tax = subtotal * (taxRate / 100)
  const grandTotal = subtotal + tax
  const paid = typeof data.paid === 'number' ? data.paid : 0
  const balance = grandTotal - paid
  const amountInWords = numberToWords(grandTotal, data.currency)

  y += 6
  const totalsW = 88
  const totalsX = pageWidth - margin - totalsW
  const totalsH = 46
  applyDrawColor(pdf, theme.border)
  pdf.rect(totalsX, y, totalsW, totalsH)

  const row = (label: string, value: string, offset: number, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    applyTextColor(pdf, theme.text)
    pdf.text(label, totalsX + 4, y + offset)
    pdf.text(value, totalsX + totalsW - 4, y + offset, { align: 'right' })
  }

  row('Subtotal', `${currencySymbol}${subtotal.toFixed(2)}`, 8)
  row(`VAT (${taxRate}%)`, `${currencySymbol}${tax.toFixed(2)}`, 16)
  row('Paid', `${currencySymbol}${paid.toFixed(2)}`, 24)
  row('Balance', `${currencySymbol}${balance.toFixed(2)}`, 32)
  applyDrawColor(pdf, theme.border)
  pdf.line(totalsX + 2, y + 36, totalsX + totalsW - 2, y + 36)
  row('Grand Total', `${currencySymbol}${grandTotal.toFixed(2)}`, 43, true)

  const wordsY = y + totalsH + 6
  const wordsHeight = 16
  applyFillColor(pdf, theme.accent)
  pdf.rect(margin, wordsY, contentWidth, wordsHeight, 'F')
  applyDrawColor(pdf, theme.border)
  pdf.rect(margin, wordsY, contentWidth, wordsHeight)
  pdf.setFont('helvetica', 'bold')
  applyTextColor(pdf, theme.secondary)
  pdf.text('Amount in words:', margin + 4, wordsY + 6)
  pdf.setFont('helvetica', 'normal')
  applyTextColor(pdf, theme.text)
  pdf.text(wrapText(pdf, amountInWords, contentWidth - 8).slice(0, 2), margin + 4, wordsY + 11)

  // Notes and memo
  let notesY = wordsY + wordsHeight + 6
  const notesText = data.notes || 'Payment is due as agreed. Please include receipt number on all payments.'
  const memoText = data.receiptDescription || data.description || '-'
  const transferMode = data.transferMode || 'Bank Transfer - Wire'

  const notesHeight = 38
  if (notesY + notesHeight > pageHeight - 45) {
    pdf.addPage()
    drawPageBackground(pdf, theme, pageWidth, pageHeight)
    notesY = margin
  }

  applyDrawColor(pdf, theme.border)
  pdf.rect(margin, notesY, contentWidth, notesHeight)
  pdf.setFont('helvetica', 'bold')
  applyTextColor(pdf, theme.secondary)
  pdf.text('NOTES / TERMS', margin + 4, notesY + 6)
  pdf.setFont('helvetica', 'normal')
  applyTextColor(pdf, theme.muted)
  pdf.text(wrapText(pdf, notesText, contentWidth - 8).slice(0, 2), margin + 4, notesY + 12)
  pdf.setFont('helvetica', 'bold')
  applyTextColor(pdf, theme.secondary)
  pdf.text('MEMO', margin + 4, notesY + 24)
  pdf.setFont('helvetica', 'normal')
  applyTextColor(pdf, theme.muted)
  pdf.text(wrapText(pdf, memoText, contentWidth - 8).slice(0, 2), margin + 4, notesY + 30)

  const transferY = notesY + notesHeight + 5
  applyDrawColor(pdf, theme.border)
  pdf.rect(margin, transferY, contentWidth, 10)
  pdf.setFont('helvetica', 'bold')
  applyTextColor(pdf, theme.secondary)
  pdf.text('Mode of Transfer:', margin + 4, transferY + 6.5)
  pdf.setFont('helvetica', 'normal')
  applyTextColor(pdf, theme.text)
  pdf.text(transferMode, margin + 40, transferY + 6.5)

  // Sign-off
  const signY = transferY + 16
  applyDrawColor(pdf, theme.border)
  pdf.line(margin + 4, signY + 14, margin + 54, signY + 14)
  pdf.setFont('helvetica', 'normal')
  applyTextColor(pdf, theme.text)
  pdf.setFontSize(9)
  pdf.text(data.signeeName || 'Authorized Signatory', margin + 4, signY + 19)
  pdf.setFontSize(8)
  applyTextColor(pdf, theme.muted)
  pdf.text('Authorized Signatory', margin + 4, signY + 23)

  if (data.signatureUrl) {
    const signatureData = await loadImageAsDataUrl(data.signatureUrl)
    if (signatureData) {
      try {
        const signatureFormat = signatureData.includes('png') ? 'PNG' : 'JPEG'
        pdf.addImage(signatureData, signatureFormat, margin + 4, signY + 2, 48, 10)
      } catch {
        // Ignore signature image issues
      }
    }
  }

  if (data.stampUrl) {
    const stampData = await loadImageAsDataUrl(data.stampUrl)
    if (stampData) {
      try {
        const stampFormat = stampData.includes('png') ? 'PNG' : 'JPEG'
        const stampW = 28
        const stampH = 28
        const stampX = pageWidth - margin - stampW
        const stampY = signY - 2
        pdf.addImage(stampData, stampFormat, stampX, stampY, stampW, stampH)
        pdf.setFontSize(8)
        applyTextColor(pdf, theme.muted)
        pdf.text('Company Stamp', stampX + stampW / 2, stampY + stampH + 4, { align: 'center' })
      } catch {
        // Ignore stamp image issues
      }
    }
  }

  // Footer
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  applyTextColor(pdf, theme.muted)
  pdf.text(
    'This is a computer-generated document and requires no physical signature for validity.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  const pdfBlob = pdf.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  onComplete?.(pdfUrl)
  return pdfUrl
}

export function DocumentTemplate({ data, onComplete }: Props) {
  useEffect(() => {
    void generateReceiptPDF(data, onComplete)
  }, [data, onComplete])

  return null
}

export async function generateDocumentPDF(data: DocumentConfig): Promise<string> {
  return generateReceiptPDF(data)
}
