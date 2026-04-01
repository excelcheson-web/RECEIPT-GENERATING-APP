'use client'

import jsPDF from 'jspdf'
import type { DocumentConfig } from '@/lib/types'

interface Props {
  data: DocumentConfig
  onComplete?: (pdfUrl: string) => void
}

// Helper function to create low-opacity watermark image
async function createWatermarkImage(imagePath: string, opacity: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw image with opacity
      ctx.globalAlpha = opacity
      ctx.drawImage(img, 0, 0)
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imagePath
  })
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

// Number to Words Conversion Function
function numberToWords(num: number, currencyCode: string | undefined): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
                'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion']
  
  const currencyWords = getCurrencyWords(currencyCode)
  if (num === 0) return `Zero ${currencyWords.major} Only`
  
  function convertChunk(n: number): string {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertChunk(n % 100) : '')
  }
  
  let result = ''
  let scaleIndex = 0
  let remaining = Math.floor(num)
  
  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk !== 0) {
      const chunkWords = convertChunk(chunk)
      result = chunkWords + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + 
               (result ? ' ' + result : '')
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex++
  }
  
  const cents = Math.round((num % 1) * 100)
  if (cents > 0) {
    result += ` ${currencyWords.major} and ${convertChunk(cents)} ${currencyWords.minor} Only`
  } else {
    result += ` ${currencyWords.major} Only`
  }
  
  return result
}

function generateReceiptNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000)
  return `GCI-INV-2026-${random}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper function to wrap text
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  words.forEach(word => {
    const testLine = currentLine ? currentLine + ' ' + word : word
    const testWidth = pdf.getTextWidth(testLine)
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines.length > 0 ? lines : [text]
}

// Main PDF generation function
async function generateReceiptPDF(data: DocumentConfig, onComplete?: (pdfUrl: string) => void): Promise<string> {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  const receiptNumber = data.receiptNumber || generateReceiptNumber()
  const issueDate = data.dateOfIssue || formatDate(new Date())
  
  // Off-white background color
  pdf.setFillColor(252, 252, 250)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Diagonal Greenhills watermark with leaf/molecule icon (opacity: 0.02)
  // Using the Gemini generated image as watermark with canvas-based opacity
  try {
    const watermarkPath = '/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png'
    // Create low-opacity version of watermark (0.02 = 2% visibility)
    const lowOpacityWatermark = await createWatermarkImage(watermarkPath, 0.02)
    // Place large diagonal watermark across center (150x150mm for large imprint)
    pdf.addImage(lowOpacityWatermark, 'PNG', pageWidth/2 - 75, pageHeight/2 - 75, 150, 150, '', 'FAST', 45)
  } catch (error) {
    // Fallback: diagonal text watermark with very light gray
    pdf.setTextColor(240, 240, 240)
    pdf.setFontSize(100)
    pdf.setFont('helvetica', 'bold')
    pdf.text('GCI', pageWidth/2, pageHeight/2, { align: 'center', angle: 45 })
  }
  
  // Reset text color
  pdf.setTextColor(0, 0, 0)
  
  // Header
  let y = 20
  
  // Logo - Increased size (max-height: 100px equivalent ~35mm)
  if (data.logoUrl) {
    try {
      if (data.logoUrl.startsWith('data:image')) {
        const format = data.logoUrl.includes('png') ? 'PNG' : 'JPEG'
        pdf.addImage(data.logoUrl, format, margin, y - 5, 50, 35)
      }
    } catch (error) {
      pdf.rect(margin, y - 5, 50, 35)
      pdf.setFontSize(8)
      pdf.text('LOGO', margin + 18, y + 12)
    }
  }
  
  // Company name in Teal color, Helvetica font (only Helvetica text)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 128, 128) // Teal color
  pdf.text('Greenhills Chemicals Incorporated', margin, y + 30)
  pdf.setTextColor(0, 0, 0) // Reset to black
  
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(180, 0, 0)
  const receiptText = 'RECEIPT'
  const receiptWidth = pdf.getTextWidth(receiptText)
  pdf.text(receiptText, pageWidth - margin - receiptWidth, y + 5)
  
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(80, 80, 80)
  pdf.text(`Receipt No: ${receiptNumber}`, pageWidth - margin - receiptWidth, y + 15)
  pdf.text(`Date: ${issueDate}`, pageWidth - margin - receiptWidth, y + 22)
  
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(0, 0, 0)
  
  // Corporate Info
  y = 65
  const boxPadding = 12
  
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 60)
  pdf.line(margin + contentWidth/2, y, margin + contentWidth/2, y + 60)
  
  pdf.setFontSize(11)
  pdf.setFont('courier', 'bold')
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, y, contentWidth/2, 10, 'F')
  pdf.text('FROM:', margin + boxPadding, y + 7)
  
  pdf.setFontSize(9)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(60, 60, 60)
  
  // FROM section with text wrapping
  const fromColumnWidth = contentWidth/2 - boxPadding * 2
  const fromTextY = y + 20
  
  const companyName = data.companyName || 'Greenhills Chemical Incorporation'
  const companyLines = wrapText(pdf, companyName, fromColumnWidth).slice(0, 2)
  companyLines.forEach((line, i) => {
    pdf.text(line, margin + boxPadding, fromTextY + (i * 6))
  })
  
  const companyAddress = data.companyAddress || '123 Industrial Way, Chemical District'
  const addressLines = wrapText(pdf, companyAddress, fromColumnWidth).slice(0, 2)
  addressLines.forEach((line, i) => {
    pdf.text(line, margin + boxPadding, fromTextY + ((companyLines.length + i) * 6))
  })
  
  const emailY = fromTextY + ((companyLines.length + addressLines.length) * 6)
  pdf.text('Email: billing@greenhills.com', margin + boxPadding, emailY)
  
  const phone = data.companyPhone ? `Phone: ${data.companyPhone}` : 'Phone: +1 (555) 123-4567'
  pdf.text(phone, margin + boxPadding, emailY + 6)
  
  pdf.setFontSize(11)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin + contentWidth/2, y, contentWidth/2, 10, 'F')
  pdf.text('BILL TO:', margin + contentWidth/2 + boxPadding, y + 7)
  
  pdf.setFontSize(9)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(60, 60, 60)
  
  // BILL TO section with text wrapping
  const billToColumnWidth = contentWidth/2 - boxPadding * 2
  const billToTextY = y + 20
  
  const customerName = data.customerName || 'Customer Name'
  const customerLines = wrapText(pdf, customerName, billToColumnWidth)
  customerLines.forEach((line, i) => {
    pdf.text(line, margin + contentWidth/2 + boxPadding, billToTextY + (i * 8))
  })
  
  const customerAddress = data.customerAddress || 'Customer Address'
  const customerAddressLines = wrapText(pdf, customerAddress, billToColumnWidth)
  customerAddressLines.forEach((line, i) => {
    pdf.text(line, margin + contentWidth/2 + boxPadding, billToTextY + ((customerLines.length + i) * 8))
  })
  
  const paymentY = billToTextY + ((customerLines.length + customerAddressLines.length) * 8)
  pdf.text('Payment Method: ' + (data.paymentMethod || 'Bank Transfer'), margin + contentWidth/2 + boxPadding, paymentY)
  // Only show selected currency and symbol
  pdf.text('Currency: ' + (data.currency || 'USD'), margin + contentWidth/2 + boxPadding, paymentY + 8)
  
  pdf.setTextColor(0, 0, 0)
  
  // Items Table
  y = 135
  
  pdf.setFontSize(12)
  pdf.setFont('courier', 'bold')
  pdf.text('ITEMS / SERVICES', margin, y)
  y += 10
  
  const colWidths = [contentWidth * 0.5, contentWidth * 0.15, contentWidth * 0.17, contentWidth * 0.18]
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]]
  
  pdf.setFillColor(220, 220, 220)
  pdf.rect(margin, y, contentWidth, 12, 'F')
  
  pdf.setFontSize(10)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Description', colX[0] + 5, y + 8)
  pdf.text('Quantity', colX[1] + 5, y + 8)
  pdf.text('Unit Price', colX[2] + 5, y + 8)
  pdf.text('Total Amount', colX[3] + 5, y + 8)
  
  pdf.setDrawColor(100, 100, 100)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 12)
  pdf.line(colX[1], y, colX[1], y + 12)
  pdf.line(colX[2], y, colX[2], y + 12)
  pdf.line(colX[3], y, colX[3], y + 12)
  
  y += 12
  
  pdf.setFontSize(9)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(60, 60, 60)
  
  let subtotal = 0
  const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0
  const currencySymbol = getCurrencySymbol(data.currency)
  
  data.items.forEach((item, index) => {
    const itemTotal = item.quantity * (item.price || 0)
    subtotal += itemTotal
    
    if (y + 15 > pageHeight - margin - 80) {
      pdf.addPage()
      y = margin + 20
      
      pdf.setFillColor(220, 220, 220)
      pdf.rect(margin, y, contentWidth, 12, 'F')
      
      pdf.setFontSize(10)
      pdf.setFont('courier', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Description', colX[0] + 5, y + 8)
      pdf.text('Quantity', colX[1] + 5, y + 8)
      pdf.text('Unit Price', colX[2] + 5, y + 8)
      pdf.text('Total Amount', colX[3] + 5, y + 8)
      
      pdf.setDrawColor(100, 100, 100)
      pdf.setLineWidth(0.5)
      pdf.rect(margin, y, contentWidth, 12)
      pdf.line(colX[1], y, colX[1], y + 12)
      pdf.line(colX[2], y, colX[2], y + 12)
      pdf.line(colX[3], y, colX[3], y + 12)
      
      y += 12
      pdf.setFontSize(9)
      pdf.setFont('courier', 'normal')
      pdf.setTextColor(60, 60, 60)
    }
    
    if (index % 2 === 1) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, y, contentWidth, 12, 'F')
    }
    
    pdf.text(item.description.substring(0, 50), colX[0] + 5, y + 8)
    pdf.text(item.quantity.toString(), colX[1] + 10, y + 8)
    pdf.text(`${currencySymbol}${(item.price || 0).toFixed(2)}`, colX[2] + 5, y + 8)
    pdf.text(`${currencySymbol}${itemTotal.toFixed(2)}`, colX[3] + 5, y + 8)
    
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, y, contentWidth, 12)
    pdf.line(colX[1], y, colX[1], y + 12)
    pdf.line(colX[2], y, colX[2], y + 12)
    pdf.line(colX[3], y, colX[3], y + 12)
    
    y += 12
  })
  
  pdf.setDrawColor(100, 100, 100)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, margin + contentWidth, y)
  
  // Financial Summary
  y += 15
  const tax = subtotal * (taxRate / 100)
  const grandTotal = subtotal + tax
  const paid = typeof data.paid === 'number' ? data.paid : 0;
  const balance = grandTotal - paid;
  const summaryX = pageWidth - margin - 110
  const labelX = summaryX
  const valueX = pageWidth - margin - 8
  // Financial Summary Box with proper padding for Amount in Words
  const financialBoxPadding = 8 // 8mm padding inside the box
  const boxWidth = 115
  const boxHeight = 85 // Increased height for paid/balance
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  // Draw the main financial summary box
  pdf.rect(summaryX - 5, y - 5, boxWidth, boxHeight)
  pdf.setFontSize(10)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(80, 80, 80)
  // Subtotal row
  pdf.text('Subtotal:', labelX, y)
  const subtotalStr = currencySymbol + subtotal.toFixed(2)
  const subtotalWidth = pdf.getTextWidth(subtotalStr)
  if (subtotalWidth > 45) {
    pdf.setFontSize(9)
  }
  pdf.text(subtotalStr, valueX, y, { align: 'right' })
  pdf.setFontSize(10)
  y += 10
  // VAT row
  pdf.text(`VAT (${taxRate}%):`, labelX, y)
  const taxStr = currencySymbol + tax.toFixed(2)
  const taxWidth = pdf.getTextWidth(taxStr)
  if (taxWidth > 45) {
    pdf.setFontSize(9)
  }
  pdf.text(taxStr, valueX, y, { align: 'right' })
  pdf.setFontSize(10)
  y += 12
  // Paid row
  pdf.text('Paid:', labelX, y)
  pdf.text(currencySymbol + paid.toFixed(2), valueX, y, { align: 'right' })
  y += 10;
  // Balance row
  pdf.text('Balance:', labelX, y)
  pdf.text(currencySymbol + balance.toFixed(2), valueX, y, { align: 'right' })
  y += 10;
  // Grand Total row with lines above and below
  pdf.setDrawColor(60, 60, 60)
  pdf.setLineWidth(0.5)
  pdf.line(summaryX - 5, y - 2, pageWidth - margin, y - 2)
  pdf.line(summaryX - 5, y + 10, pageWidth - margin, y + 10)
  pdf.setFontSize(12)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(180, 0, 0)
  pdf.text('GRAND TOTAL:', labelX, y + 6)
  const grandTotalStr = currencySymbol + grandTotal.toFixed(2)
  const grandTotalWidth = pdf.getTextWidth(grandTotalStr)
  if (grandTotalWidth > 50) {
    pdf.setFontSize(10)
  }
  pdf.text(grandTotalStr, valueX, y + 6, { align: 'right' })

  // Amount in Words Section with dedicated container and padding
  // Create visual separation from Grand Total
  y += 18 // Space after Grand Total line
  // Define Amount in Words container with internal padding
  const amountInWordsContainerY = y
  const amountInWordsContainerHeight = 25 // Height for the container
  const amountInWordsPadding = 3 // 3mm internal padding
  // Draw a subtle background for the Amount in Words section (optional, for visual separation)
  pdf.setFillColor(250, 250, 250) // Very light gray background
  pdf.rect(summaryX - 5 + 1, amountInWordsContainerY, boxWidth - 2, amountInWordsContainerHeight, 'F')
  // Amount in Words - BLACK color, Courier font, with proper padding
  pdf.setFontSize(9) // Slightly smaller to fit better
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(0, 0, 0) // Black color
  const amountInWords = numberToWords(grandTotal, data.currency)
  // Wrap text with constrained width to ensure it stays within padded area
  // Available width = boxWidth - (2 * padding) - label margin
  const availableWidth = boxWidth - (2 * amountInWordsPadding) - 5
  const wordsLines = wrapText(pdf, `Amount in words: ${amountInWords}`, availableWidth)
  // Draw text with internal padding (offset by padding amount)
  const textStartX = labelX + amountInWordsPadding
  const textStartY = amountInWordsContainerY + amountInWordsPadding + 4 // +4 for line height offset
  wordsLines.forEach((line, i) => {
    if (i < 3) { // Allow up to 3 lines
      pdf.text(line, textStartX, textStartY + (i * 5)) // 5mm line spacing
    }
  })
  // Reset text color
  pdf.setTextColor(0, 0, 0)
  pdf.setTextColor(0, 0, 0)
  
  // Notes Section
  y += 30
  const notesAndFooterHeight = 140
  if (y + notesAndFooterHeight > pageHeight - margin) {
    pdf.addPage()
    y = margin + 20
  }
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 42)
  pdf.setFontSize(10)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(80, 80, 80)
  pdf.text('NOTES / TERMS:', margin + 5, y + 6)
  pdf.setFontSize(9)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(100, 100, 100)
  const notesText = data.notes || 'Payment is due within 30 days. Please include receipt number on all payments. For questions, contact billing@greenhills.com'
  const notesLines = wrapText(pdf, notesText, contentWidth - 10)
  notesLines.forEach((line, i) => {
    if (i < 3) {
      pdf.text(line, margin + 5, y + 14 + (i * 5))
    }
  })
  // Receipt Description/Memo under Notes
  pdf.setFontSize(10)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(80, 80, 80)
  pdf.text('RECEIPT DESCRIPTION / MEMO:', margin + 5, y + 24)
  pdf.setFontSize(9)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(100, 100, 100)
  const descText = data.receiptDescription || data.description || ''
  const descLines = wrapText(pdf, descText, contentWidth - 10)
  descLines.forEach((line, i) => {
    if (i < 2) {
      pdf.text(line, margin + 5, y + 30 + (i * 5))
    }
  })
  
  // Mode of Transfer and Receipt Description - Formal boxed layout
  y += 47
  
  // Draw box around transfer and description sections
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 45)
  
  // Vertical divider between sections
  pdf.line(margin + contentWidth/2, y, margin + contentWidth/2, y + 45)
  
  // MODE OF TRANSFER - Left side
  pdf.setFontSize(9)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(80, 80, 80)
  pdf.text('MODE OF TRANSFER:', margin + 5, y + 8)
  
  pdf.setFontSize(8)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(60, 60, 60)
  const transferMode = data.transferMode || 'Bank Transfer - Wire'
  pdf.text(transferMode, margin + 5, y + 18)
  
  // RECEIPT DESCRIPTION - Right side
  pdf.setFontSize(9)
  pdf.setFont('courier', 'bold')
  pdf.setTextColor(80, 80, 80)
  pdf.text('RECEIPT DESCRIPTION:', margin + contentWidth/2 + 5, y + 8)
  
  pdf.setFontSize(8)
  pdf.setFont('courier', 'normal')
  pdf.setTextColor(60, 60, 60)
  const receiptDesc = data.receiptDescription || 'Payment for goods and services rendered'
  const receiptDescLines = wrapText(pdf, receiptDesc, contentWidth/2 - 10)
  receiptDescLines.forEach((line, i) => {
    if (i < 3) {
      pdf.text(line, margin + contentWidth/2 + 5, y + 18 + (i * 5))
    }
  })
  
  // Validation Footer - Reduced clearance from receipt description box (was 50, now 35)
  y += 35
  
  const validationFooterY = y
  
  // Signature Image - LEFT SIDE using Signature.png (reduced size to match text)
  const sigX = margin
  const sigY = validationFooterY + 5
  const sigWidth = 35
  const sigHeight = 18
  
  try {
    const signatureImagePath = '/Signature.png'
    pdf.addImage(signatureImagePath, 'PNG', sigX, sigY, sigWidth, sigHeight)
  } catch (error) {
    // Fallback: draw signature line if image fails (reduced length)
    pdf.setLineWidth(0.3)
    pdf.setDrawColor(100, 100, 100)
    pdf.line(sigX + 5, sigY + 14, sigX + 30, sigY + 14)
  }
  
  // Line directly under signature (reduced length to match image)
  pdf.setLineWidth(0.5)
  pdf.setDrawColor(100, 100, 100)
  pdf.line(sigX + 5, sigY + sigHeight + 2, sigX + 30, sigY + sigHeight + 2)
  
  // Fixed signee name: J. Mitchell with "Authorized Signatory | Accountant" on one line
  pdf.setTextColor(100, 100, 100)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  const signeeName = 'J. Mitchell'
  const signeeWidth = pdf.getTextWidth(signeeName)
  pdf.text(signeeName, sigX + (sigWidth - signeeWidth) / 2, sigY + sigHeight + 10)
  
  // "Authorized Signatory | Accountant" on one line below the name
  pdf.setFontSize(7)
  const authText = 'Authorized Signatory | Accountant'
  const authWidth = pdf.getTextWidth(authText)
  pdf.text(authText, sigX + (sigWidth - authWidth) / 2, sigY + sigHeight + 18)
  
  // PAID Stamp Image - RIGHT SIDE using Untitled design (1).png
  const stampX = pageWidth - margin - 50
  const stampY = validationFooterY + 5
  const stampWidth = 40
  const stampHeight = 40
  
  try {
    const stampImagePath = '/Untitled design (1).png'
    pdf.addImage(stampImagePath, 'PNG', stampX, stampY, stampWidth, stampHeight)
  } catch (error) {
    // Fallback: draw simple PAID text if image fails
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(180, 0, 0)
    pdf.text('PAID', stampX + 5, stampY + 25)
  }
  
  pdf.setTextColor(0, 0, 0)
  
  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 20
  
  pdf.setFontSize(8)
  pdf.setFont('courier', 'italic')
  pdf.setTextColor(150, 150, 150)
  pdf.text(
    'This is a computer-generated document and requires no physical signature for validity. Thank you for your business.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )
  
  const pdfBlob = pdf.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  onComplete?.(pdfUrl)
  
  pdf.save(`receipt_${receiptNumber}.pdf`)
  
  return pdfUrl
}

// React component
export function DocumentTemplate({ data, onComplete }: Props) {
  generateReceiptPDF(data, onComplete)
  return null
}

// Export for direct use
export async function generateDocumentPDF(data: DocumentConfig): Promise<string> {
  return generateReceiptPDF(data)
}
