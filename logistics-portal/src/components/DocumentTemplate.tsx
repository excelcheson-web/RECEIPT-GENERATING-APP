'use client'

import jsPDF from 'jspdf'
import type { DocumentConfig } from '@/lib/types'

interface Props {
  data: DocumentConfig
  onComplete?: (pdfUrl: string) => void
}

// Number to Words Conversion Function
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
                'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion']
  
  if (num === 0) return 'Zero Dollars Only'
  
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
    result += ' Dollars and ' + convertChunk(cents) + ' Cents Only'
  } else {
    result += ' Dollars Only'
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
  
  // Watermark
  pdf.setTextColor(200, 200, 200)
  pdf.setFontSize(50)
  pdf.setFont('helvetica', 'bold')
  pdf.text('GREENHILLS', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45
  })
  pdf.setTextColor(0, 0, 0)
  
  // Header
  let y = 20
  
  // Logo - Increased size (max-height: 100px equivalent ~35mm)
  if (data.logoUrl) {
    try {
      if (data.logoUrl.startsWith('data:image')) {
        const format = data.logoUrl.includes('png') ? 'PNG' : 'JPEG'
        // Increased logo size: 50x35 (was 35x25)
        pdf.addImage(data.logoUrl, format, margin, y - 5, 50, 35)
      }
    } catch (error) {
      pdf.rect(margin, y - 5, 50, 35)
      pdf.setFontSize(8)
      pdf.text('LOGO', margin + 18, y + 12)
    }
  }
  
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 51, 102)
  pdf.text(data.companyName || 'Greenhills Chemical Incorporation', margin, y + 30)
  
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
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)
  
  // Corporate Info
  y = 65
  const boxPadding = 12
  
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 60)
  pdf.line(margin + contentWidth/2, y, margin + contentWidth/2, y + 60)
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, y, contentWidth/2, 10, 'F')
  pdf.text('FROM:', margin + boxPadding, y + 7)
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(60, 60, 60)
  
  // FROM section with text wrapping
  const fromColumnWidth = contentWidth/2 - boxPadding * 2
  const fromTextY = y + 20
  
  // Company name with wrapping
  const companyName = data.companyName || 'Greenhills Chemical Incorporation'
  const companyLines = wrapText(pdf, companyName, fromColumnWidth)
  companyLines.forEach((line, i) => {
    pdf.text(line, margin + boxPadding, fromTextY + (i * 8))
  })
  
  // Address with wrapping
  const companyAddress = data.companyAddress || '123 Industrial Way, Chemical District'
  const addressLines = wrapText(pdf, companyAddress, fromColumnWidth)
  addressLines.forEach((line, i) => {
    pdf.text(line, margin + boxPadding, fromTextY + ((companyLines.length + i) * 8))
  })
  
  // Email
  const emailY = fromTextY + ((companyLines.length + addressLines.length) * 8)
  pdf.text('Email: billing@greenhills.com', margin + boxPadding, emailY)
  
  // Phone
  const phone = data.companyPhone || 'Phone: +1 (555) 123-4567'
  pdf.text(phone, margin + boxPadding, emailY + 8)
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin + contentWidth/2, y, contentWidth/2, 10, 'F')
  pdf.text('BILL TO:', margin + contentWidth/2 + boxPadding, y + 7)
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(60, 60, 60)
  
  // BILL TO section with text wrapping
  const billToColumnWidth = contentWidth/2 - boxPadding * 2
  const billToTextY = y + 20
  
  // Customer name with wrapping
  const customerName = data.customerName || 'Customer Name'
  const customerLines = wrapText(pdf, customerName, billToColumnWidth)
  customerLines.forEach((line, i) => {
    pdf.text(line, margin + contentWidth/2 + boxPadding, billToTextY + (i * 8))
  })
  
  // Customer address with wrapping
  const customerAddress = data.customerAddress || 'Customer Address'
  const customerAddressLines = wrapText(pdf, customerAddress, billToColumnWidth)
  customerAddressLines.forEach((line, i) => {
    pdf.text(line, margin + contentWidth/2 + boxPadding, billToTextY + ((customerLines.length + i) * 8))
  })
  
  // Payment method
  const paymentY = billToTextY + ((customerLines.length + customerAddressLines.length) * 8)
  pdf.text('Payment Method: ' + (data.paymentMethod || 'Bank Transfer'), margin + contentWidth/2 + boxPadding, paymentY)
  
  // Currency
  pdf.text('Currency: ' + (data.currency || 'USD'), margin + contentWidth/2 + boxPadding, paymentY + 8)
  
  pdf.setTextColor(0, 0, 0)
  
  // Items Table
  y = 135
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ITEMS / SERVICES', margin, y)
  y += 10
  
  const colWidths = [contentWidth * 0.5, contentWidth * 0.15, contentWidth * 0.17, contentWidth * 0.18]
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]]
  
  // Header row with increased padding (12px)
  pdf.setFillColor(220, 220, 220)
  pdf.rect(margin, y, contentWidth, 12, 'F')
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
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
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(60, 60, 60)
  
  let subtotal = 0
  const taxRate = 16
  
  data.items.forEach((item, index) => {
    const itemTotal = item.quantity * (item.price || 0)
    subtotal += itemTotal
    
    // Check if we need a new page (keep table rows together)
    if (y + 15 > pageHeight - margin - 80) { // Leave room for totals and footer
      pdf.addPage()
      y = margin + 20
      
      // Redraw table header on new page
      pdf.setFillColor(220, 220, 220)
      pdf.rect(margin, y, contentWidth, 12, 'F')
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
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
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(60, 60, 60)
    }
    
    if (index % 2 === 1) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, y, contentWidth, 12, 'F')
    }
    
    pdf.text(item.description.substring(0, 50), colX[0] + 5, y + 8)
    pdf.text(item.quantity.toString(), colX[1] + 10, y + 8)
    pdf.text(`$${(item.price || 0).toFixed(2)}`, colX[2] + 5, y + 8)
    pdf.text(`$${itemTotal.toFixed(2)}`, colX[3] + 5, y + 8)
    
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
  
  const summaryX = pageWidth - margin - 110
  const labelX = summaryX
  const valueX = pageWidth - margin - 5
  
  // Financial box - increased width for amount in words
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.rect(summaryX - 5, y - 5, 110, 45)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  
  pdf.text('Subtotal:', labelX, y)
  pdf.text(`$${subtotal.toFixed(2)}`, valueX, y, { align: 'right' })
  y += 10
  
  pdf.text(`VAT (${taxRate}%):`, labelX, y)
  pdf.text(`$${tax.toFixed(2)}`, valueX, y, { align: 'right' })
  y += 12
  
  // Grand Total with single border (cleaner look)
  pdf.setDrawColor(60, 60, 60)
  pdf.setLineWidth(0.5)
  pdf.line(summaryX - 5, y - 2, pageWidth - margin, y - 2)
  pdf.line(summaryX - 5, y + 10, pageWidth - margin, y + 10)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(180, 0, 0)
  pdf.text('GRAND TOTAL:', labelX, y + 6)
  pdf.text(`$${grandTotal.toFixed(2)}`, valueX, y + 6, { align: 'right' })
  
  y += 14
  
  // Amount in Words - Balanced inside the column
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(100, 100, 100)
  const amountInWords = numberToWords(grandTotal)
  
  // Wrap amount in words text with proper width to fit inside column
  const wordsMaxWidth = 80
  const wordsLines = wrapText(pdf, `Amount in words: ${amountInWords}`, wordsMaxWidth)
  wordsLines.forEach((line, i) => {
    pdf.text(line, labelX, y + (i * 9))
  })
  
  pdf.setTextColor(0, 0, 0)
  
  // Notes Section - Before signature and stamp
  y += 25
  
  // Check if we need a new page for notes and footer
  const notesAndFooterHeight = 80
  if (y + notesAndFooterHeight > pageHeight - margin) {
    pdf.addPage()
    y = margin + 20
  }
  
  // Notes box
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 35)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(80, 80, 80)
  pdf.text('NOTES / TERMS:', margin + 5, y + 8)
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  
  const notesText = data.notes || 'Payment is due within 30 days. Please include receipt number on all payments. For questions, contact billing@greenhills.com'
  const notesLines = wrapText(pdf, notesText, contentWidth - 10)
  notesLines.forEach((line, i) => {
    if (i < 3) { // Limit to 3 lines to fit in box
      pdf.text(line, margin + 5, y + 18 + (i * 6))
    }
  })
  
  // Validation Footer - Dedicated container at bottom
  y += 45
  // Layout: Signature on LEFT, Seal Image on RIGHT
  const validationFooterY = y
  const validationFooterHeight = 45
  
  // Signature Section - LEFT SIDE with Generated Handwritten Signature
  const sigX = margin
  const sigY = validationFooterY + 15
  
  // Signature baseline
  pdf.setLineWidth(0.3)
  pdf.setDrawColor(100, 100, 100)
  pdf.line(sigX, sigY, sigX + 80, sigY)
  
  // Generate handwritten signature "J. Mitchell" using curves
  pdf.setLineWidth(0.8)
  pdf.setDrawColor(0, 30, 80)
  
  // J - vertical stroke with slight curve
  pdf.lines([[0, -12], [1, -2], [-1, 2], [0, 12]], sigX + 8, sigY - 8, [1, 1], 'S')
  // J - bottom curve
  pdf.lines([[-3, 0], [-2, 2], [0, 1], [4, 0]], sigX + 8, sigY - 2, [1, 1], 'S')
  
  // Dot for J
  pdf.setFillColor(0, 30, 80)
  pdf.circle(sigX + 8, sigY - 14, 0.8, 'F')
  
  // Period after J
  pdf.circle(sigX + 12, sigY - 3, 0.6, 'F')
  
  // Space
  
  // M - first stroke (down)
  pdf.lines([[0, -10], [-1, 2]], sigX + 18, sigY - 3, [1, 1], 'S')
  // M - up stroke
  pdf.lines([[2, -6], [2, 6]], sigX + 18, sigY - 13, [1, 1], 'S')
  // M - down stroke
  pdf.lines([[2, 10], [1, -2]], sigX + 22, sigY - 7, [1, 1], 'S')
  
  // i - vertical stroke
  pdf.lines([[0, -8], [0.5, 0]], sigX + 28, sigY - 3, [1, 1], 'S')
  // i - dot
  pdf.circle(sigX + 28.5, sigY - 13, 0.7, 'F')
  
  // t - vertical
  pdf.lines([[0, -10], [0, 4]], sigX + 32, sigY - 3, [1, 1], 'S')
  // t - cross
  pdf.lines([[-2, 0], [4, 0]], sigX + 30, sigY - 8, [1, 1], 'S')
  
  // c - curve
  pdf.lines([[-3, -2], [-2, 4], [2, 4], [3, -2]], sigX + 38, sigY - 6, [1, 1], 'S')
  
  // h - vertical
  pdf.lines([[0, -12], [0, 8]], sigX + 44, sigY - 3, [1, 1], 'S')
  // h - curve
  pdf.lines([[0, -4], [3, -2], [3, 4]], sigX + 44, sigY - 11, [1, 1], 'S')
  
  // e - loop
  pdf.lines([[3, 0], [0, -3], [-3, 0], [0, 3], [2, 1]], sigX + 52, sigY - 6, [1, 1], 'S')
  
  // l - vertical
  pdf.lines([[0, -12], [0.3, 0]], sigX + 58, sigY - 3, [1, 1], 'S')
  
  // l - vertical (second)
  pdf.lines([[0, -12], [0.3, 0]], sigX + 62, sigY - 3, [1, 1], 'S')
  
  // Signature flourish underline
  pdf.setLineWidth(0.4)
  pdf.lines([[0, 0], [8, -2], [12, 1], [15, -1], [10, 2]], sigX + 20, sigY - 1, [1, 1], 'S')
  
  // Authorized Signatory text
  pdf.setTextColor(100, 100, 100)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const authText = 'Authorized Signatory'
  const authWidth = pdf.getTextWidth(authText)
  pdf.text(authText, sigX + (80 - authWidth) / 2, sigY + 8)
  
  // GCI Seal Image - RIGHT SIDE (using the provided image)
  const sealX = pageWidth - margin - 60
  const sealY = validationFooterY + 5
  const sealWidth = 50
  const sealHeight = 50
  
  // Add the GCI seal image
  try {
    const sealImagePath = '/Untitled design (1).png'
    // For jsPDF, we need to load the image as base64 or use the public URL
    // Since this is a local file, we'll try to add it directly
    pdf.addImage(sealImagePath, 'PNG', sealX, sealY, sealWidth, sealHeight)
  } catch (error) {
    // If image fails to load, draw a placeholder
    pdf.setDrawColor(150, 150, 150)
    pdf.setLineWidth(0.5)
    pdf.rect(sealX, sealY, sealWidth, sealHeight)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text('GCI SEAL', sealX + 15, sealY + 28)
  }
  
  pdf.setTextColor(0, 0, 0)
  
  // Footer
  const footerY = pdf.internal.pageSize.getHeight() - 20
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
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
  // Auto-generate PDF when component mounts
  generateReceiptPDF(data, onComplete)
  return null
}

// Export for direct use
export async function generateDocumentPDF(data: DocumentConfig): Promise<string> {
  return generateReceiptPDF(data)
}
