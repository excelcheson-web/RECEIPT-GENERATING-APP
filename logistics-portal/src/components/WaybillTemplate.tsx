'use client'

import { useEffect } from 'react'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { WaybillFormData } from '@/lib/types'
import { SKYDEX_CONFIG } from '@/lib/constants'

interface WaybillTemplateProps {
  data: WaybillFormData
  onComplete?: (pdfUrl: string) => void
}

// Skyship brand colors
const BRAND = {
  primary: '#001f3f',    // Dark blue
  secondary: '#9DC400', // Lime green
  accent: '#7A9A00',   // Darker green
  text: '#333333',
  light: '#f5f5f5',
  white: '#ffffff',
  red: '#dc2626',        // For stamps
}

export async function generateWaybillPDF(data: WaybillFormData): Promise<string> {
  // Create PDF with A4 size
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 16
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  const contentWidth = pageWidth - 2 * margin

  // Helper function to draw grid box
  const drawGridBox = (x: number, y: number, w: number, h: number, title: string, content: string[]) => {
    // Box border
    pdf.setDrawColor(0)
    pdf.setLineWidth(0.5)
    pdf.rect(x, y, w, h)

    // Title background
    pdf.setFillColor(BRAND.primary)
    pdf.rect(x, y, w, 8, 'F')

    // Title text
    pdf.setTextColor(BRAND.white)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(title, x + 2, y + 5.5)

    // Content
    pdf.setTextColor(BRAND.text)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    
    let contentY = y + 12
    content.forEach(line => {
      if (contentY < y + h - 3) {
        pdf.text(line, x + 3, contentY)
        contentY += 5
      }
    })
  }

  // ========== HEADER ==========
  // Skyship branding header
  pdf.setFillColor(BRAND.primary)
  pdf.rect(0, 0, pageWidth, 35, 'F')

  // Logo placeholder (left)
  pdf.setTextColor(BRAND.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text('SKYDEX', margin, 15)

  pdf.setTextColor(BRAND.white)
  pdf.setFontSize(12)
  pdf.text('LOGISTICS', margin, 22)

  // Waybill title (center)
  pdf.setTextColor(BRAND.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.text('WAYBILL', pageWidth / 2, 20, { align: 'center' })

  // Consignment number (right)
  pdf.setTextColor(BRAND.secondary)
  pdf.setFontSize(10)
  pdf.text('CONSIGNMENT NO.', pageWidth - margin - 40, 12, { align: 'right' })
  
  pdf.setTextColor(BRAND.white)
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(14)
  pdf.text(data.consignmentNumber, pageWidth - margin - 40, 20, { align: 'right' })

  // ========== BARCODE ==========
  // Generate barcode
  const barcodeCanvas = document.createElement('canvas')
  JsBarcode(barcodeCanvas, data.consignmentNumber, {
    format: 'CODE128',
    width: 2,
    height: 40,
    displayValue: true,
    font: 'monospace',
    fontSize: 12,
    textMargin: 2,
  })
  const barcodeDataUrl = barcodeCanvas.toDataURL('image/png')
  
  // Add barcode to PDF (centered below header)
  pdf.addImage(barcodeDataUrl, 'PNG', pageWidth / 2 - 50, 38, 100, 25)

  let currentY = 70

  // ========== SECTION 1: FROM (SENDER) ==========
  drawGridBox(
    margin,
    currentY,
    contentWidth / 2 - 2,
    35,
    '1. FROM (SENDER)',
    [
      `Account No: ${data.senderAccountNo || 'N/A'}`,
      `Name: ${data.senderName}`,
      `Address: ${data.senderAddress}`,
    ]
  )

  // ========== SECTION 2: TO (RECEIVER) ==========
  drawGridBox(
    margin + contentWidth / 2 + 2,
    currentY,
    contentWidth / 2 - 2,
    35,
    '2. TO (RECEIVER)',
    [
      `Name: ${data.receiverName}`,
      `Telephone: ${data.receiverTelephone}`,
      `Address: ${data.receiverAddress}`,
    ]
  )

  currentY += 40

  // ========== SECTION 3: SHIPMENT SPECS ==========
  drawGridBox(
    margin,
    currentY,
    contentWidth,
    30,
    '3. SHIPMENT SPECIFICATIONS',
    [
      `Pieces: ${data.pieces} | Weight: ${data.weight} kg | Dimensions: ${data.dimensions.length}×${data.dimensions.width}×${data.dimensions.height} cm`,
      `Contents: ${data.contents}`,
    ]
  )

  currentY += 35

  // ========== SECTION 4: FINANCIALS ==========
  // Create financial table
  pdf.setDrawColor(0)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, currentY, contentWidth, 35)

  // Title
  pdf.setFillColor(BRAND.primary)
  pdf.rect(margin, currentY, contentWidth, 8, 'F')
  pdf.setTextColor(BRAND.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('4. FINANCIALS (USD)', margin + 2, currentY + 5.5)

  // Financial data table
  const colWidth = contentWidth / 5
  const financialY = currentY + 12

  // Headers
  pdf.setTextColor(BRAND.text)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('Insurance', margin + 3, financialY)
  pdf.text('Airport Tax & VAT', margin + colWidth + 3, financialY)
  pdf.text('Destination Duty', margin + colWidth * 2 + 3, financialY)
  pdf.text('Base Freight', margin + colWidth * 3 + 3, financialY)
  pdf.text('TOTAL', margin + colWidth * 4 + 3, financialY)

  // Values
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`$${data.insurance.toFixed(2)}`, margin + 3, financialY + 8)
  pdf.text(`$${data.airportTaxVat.toFixed(2)}`, margin + colWidth + 3, financialY + 8)
  pdf.text(`$${data.destinationDuty.toFixed(2)}`, margin + colWidth * 2 + 3, financialY + 8)
  pdf.text(`$${data.baseFreight.toFixed(2)}`, margin + colWidth * 3 + 3, financialY + 8)
  
  // Total in bold with highlight
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(BRAND.secondary)
  pdf.text(`$${data.currencyTotal.toFixed(2)}`, margin + colWidth * 4 + 3, financialY + 8)

  currentY += 40

  // ========== SECTION 5: SERVICE TYPE ==========
  pdf.setDrawColor(0)
  pdf.rect(margin, currentY, contentWidth, 20)

  // Title
  pdf.setFillColor(BRAND.primary)
  pdf.rect(margin, currentY, contentWidth, 8, 'F')
  pdf.setTextColor(BRAND.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('5. SERVICE TYPE', margin + 2, currentY + 5.5)

  // Service checkboxes
  const serviceY = currentY + 14
  const services = [
    { label: 'Diplomatic Courier', checked: data.serviceType.diplomaticCourier },
    { label: 'Domestic', checked: data.serviceType.domestic },
    { label: 'World Mail', checked: data.serviceType.worldMail },
    { label: 'Repair/Return', checked: data.serviceType.repairReturn },
  ]

  pdf.setTextColor(BRAND.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  services.forEach((service, index) => {
    const x = margin + 5 + (index * (contentWidth / 4))
    // Draw checkbox
    pdf.rect(x, serviceY - 3, 4, 4)
    if (service.checked) {
      pdf.setFillColor(BRAND.secondary)
      pdf.rect(x + 0.5, serviceY - 2.5, 3, 3, 'F')
    }
    // Label
    pdf.text(service.label, x + 6, serviceY)
  })

  currentY += 25

  // ========== SECTION 6: DATES ==========
  drawGridBox(
    margin,
    currentY,
    contentWidth,
    20,
    '6. DATES',
    [
      `Date of Departure: ${data.departureDate} | Arrival Date: ${data.arrivalDate}`,
    ]
  )

  currentY += 25

  // ========== QR CODE ==========
  // Generate QR code linking to track page
  const trackUrl = `${window.location.origin}/track/${data.consignmentNumber}`
  const qrDataUrl = await QRCode.toDataURL(trackUrl, { width: 128, margin: 2 })
  
  // Add QR code
  pdf.addImage(qrDataUrl, 'PNG', margin, currentY, 25, 25)
  
  // QR code label
  pdf.setTextColor(BRAND.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Scan to Track', margin + 5, currentY + 28)

  // ========== STAMPS ==========
  const stampY = currentY + 5

  // "Original" circular red stamp (Bottom Right)
  pdf.setDrawColor(BRAND.red)
  pdf.setLineWidth(2)
  pdf.circle(pageWidth - margin - 25, stampY + 10, 15)
  
  pdf.setTextColor(BRAND.red)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('ORIGINAL', pageWidth - margin - 35, stampY + 8)
  pdf.setFontSize(8)
  pdf.text('SKYDEX', pageWidth - margin - 32, stampY + 14)

  // "Skyship Logistics & Shipping" rectangular stamp (Bottom Center)
  const rectX = pageWidth / 2 - 30
  pdf.setDrawColor(BRAND.red)
  pdf.setLineWidth(1.5)
  pdf.rect(rectX, stampY, 60, 20)
  
  pdf.setTextColor(BRAND.red)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('SKYDEX LOGISTICS', rectX + 5, stampY + 7)
  pdf.text('& SHIPPING', rectX + 15, stampY + 13)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.text('AUTHORIZED', rectX + 18, stampY + 17)

  currentY += 35

  // ========== SIGNATURES ==========
  pdf.setDrawColor(0)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, currentY, contentWidth, 30)

  // Title
  pdf.setFillColor(BRAND.primary)
  pdf.rect(margin, currentY, contentWidth, 8, 'F')
  pdf.setTextColor(BRAND.white)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('7. AUTHORIZATIONS', margin + 2, currentY + 5.5)

  // Signature lines
  const sigY = currentY + 20
  pdf.setDrawColor(BRAND.text)
  pdf.setLineWidth(0.5)
  
  // Sender signature
  pdf.line(margin + 5, sigY, margin + 60, sigY)
  pdf.setTextColor(BRAND.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Sender Signature', margin + 5, sigY + 4)

  // Official signature
  pdf.line(margin + 80, sigY, margin + 135, sigY)
  pdf.text('Authorized Official', margin + 80, sigY + 4)

  // Date
  pdf.line(margin + 155, sigY, margin + 195, sigY)
  pdf.text('Date', margin + 155, sigY + 4)

  // Add uploaded signatures if available
  if (data.senderSignatureUrl) {
    try {
      pdf.addImage(data.senderSignatureUrl, 'PNG', margin + 5, sigY - 15, 55, 15)
    } catch (e) {
      // Ignore if image fails to load
    }
  }

  if (data.officialStampUrl) {
    try {
      pdf.addImage(data.officialStampUrl, 'PNG', margin + 80, sigY - 15, 55, 15)
    } catch (e) {
      // Ignore if image fails to load
    }
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - 15
  pdf.setDrawColor(BRAND.primary)
  pdf.setLineWidth(2)
  pdf.line(0, footerY - 5, pageWidth, footerY - 5)

  pdf.setTextColor(BRAND.text)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('© 2026 SKYDEX Logistics. All rights reserved.', margin, footerY)
  pdf.text('For tracking, visit: skydex.com/track', pageWidth - margin, footerY, { align: 'right' })

  // Generate PDF blob and URL
  const pdfBlob = pdf.output('blob')
  return URL.createObjectURL(pdfBlob)
}

// React component wrapper
export function WaybillTemplate({ data, onComplete }: WaybillTemplateProps) {
  const generatePDF = async () => {
    try {
      const pdfUrl = await generateWaybillPDF(data)
      onComplete?.(pdfUrl)
      
      // Auto-download
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `waybill_${data.consignmentNumber}.pdf`
      link.click()
    } catch (error) {
      console.error('Error generating waybill PDF:', error)
      alert('Error generating waybill. Please try again.')
    }
  }

  // Auto-generate on mount
  useEffect(() => {
    generatePDF()
  }, [data])

  return null
}
