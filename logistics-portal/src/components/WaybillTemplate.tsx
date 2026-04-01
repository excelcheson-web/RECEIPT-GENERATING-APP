'use client'

import { useEffect } from 'react'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import type { WaybillFormData } from '@/lib/types'
import { SKYSHIP_CONFIG } from '@/lib/constants'

interface WaybillTemplateProps {
  data: WaybillFormData
  onComplete?: (pdfUrl: string) => void
}

// Professional Waybill color scheme - Faded lemon green + soft blue
const COLORS = {
  primary: '#CDDC39',       // Soft lemon green for headers
  secondary: '#1E3A8A',     // Deep blue for borders and text
  border: '#DCDCDC',         // Light grey borders
  background: '#FAFAFA',     // Off-white background
  textDark: '#1F2937',       // Dark text
  textLight: '#6B7280',      // Light text
  white: '#FFFFFF',
}

// Cache for loaded images
const imageCache: Record<string, string> = {}

// Function to load image and convert to data URL
async function loadImageAsDataURL(url: string): Promise<string | null> {
  if (imageCache[url]) return imageCache[url]
  
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        imageCache[url] = result
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('Failed to load image:', url, e)
    return null
  }
}

// Get dynamic title based on transport mode
function getWaybillTitle(transportMode?: string): string {
  const mode = transportMode?.toLowerCase() || 'air'
  
  switch (mode) {
    case 'air':
      return 'AIR WAYBILL'
    case 'sea':
      return 'SEA WAYBILL'
    case 'land':
      return 'LAND WAYBILL'
    case 'door_to_door':
    case 'door':
      return 'DOOR TO DOOR WAYBILL'
    default:
      return 'AIR WAYBILL'
  }
}

export async function generateWaybillPDF(data: WaybillFormData): Promise<string> {
  // Create PDF with landscape A4 size for horizontal layout
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 16
  })

  const pageWidth = 297  // A4 landscape width
  const pageHeight = 210 // A4 landscape height
  const margin = 8
  const footerBottomMargin = 10
  const contentWidth = pageWidth - 2 * margin
  
  // Set off-white background
  pdf.setFillColor(COLORS.background)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  let currentY = margin

  const drawWrappedClampedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    lineHeight: number
  ) => {
    const safeText = String(text || '')
    const wrapped = pdf.splitTextToSize(safeText, maxWidth)
    const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight))
    const lines = wrapped.slice(0, maxLines)
    pdf.text(lines, x, y)
    return lines.length
  }

  // ========== HEADER SECTION ==========
  const headerHeight = 30  // Increased from 25 to 30 to prevent overlap
  
  // Left: Official Stamp Box - Positioned higher to prevent overlap with shipper box
  const stampBoxWidth = 35
  const stampBoxHeight = 30 // Reduced from 35 to 30
  const stampX = margin
  const stampY = currentY
  
  pdf.setDrawColor(COLORS.secondary)
  pdf.setLineWidth(1)
  pdf.rect(stampX, stampY, stampBoxWidth, stampBoxHeight)
  
  // Stamp label
  pdf.setFillColor(COLORS.primary)
  pdf.rect(stampX, stampY, stampBoxWidth, 6, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.text('OFFICIAL STAMP', stampX + 2, stampY + 4)
  
  // Try to add stamp image - Compact size
  const stampImage = await loadImageAsDataURL('/LOGISTICS STAMP.png')
  if (stampImage) {
    try {
      // Compact stamp image to fit within 35x30mm box
      pdf.addImage(stampImage, 'PNG', stampX + 3, stampY + 8, 29, 20)
    } catch (e) {
      console.error('Failed to add stamp image:', e)
    }
  } else {
    pdf.setTextColor(COLORS.textLight)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.text('[Company Stamp]', stampX + 6, stampY + 20)
  }

  // Center: Logo, WAYBILL Title and Company Info
  const title = getWaybillTitle(data.transportMode)
  
  // Try to add company logo - positioned to cover space to the left
  const logoUrl = data.logoUrl || data.senderLogoUrl || '/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png'
  const logoImage = await loadImageAsDataURL(logoUrl)
  
  // Calculate title width to position logo beside it
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  const titleText = 'WAYBILL'
  const titleWidth = pdf.getTextWidth(titleText)
  const titleX = pageWidth / 2
  const titleY = currentY + 8
  
  // Position logo to the left of the title with spacing - SIGNIFICANTLY INCREASED SIZE
  const logoWidth = 55  // Increased from 40 to 55 to cover more space
  const logoHeight = 38 // Increased from 28 to 38 for proportional scaling
  const spacing = 8     // Reduced spacing to allow logo to extend further left
  
  if (logoImage) {
    try {
      // Logo positioned to the left of the title, vertically centered with title
      // Extended to the left to cover more space with small marginal space to shipper/consignee boxes
      const logoX = titleX - (titleWidth / 2) - logoWidth - spacing
      const logoY = titleY - (logoHeight / 2) - 2 // Adjust to vertically align with title
      pdf.addImage(logoImage, 'PNG', logoX, logoY, logoWidth, logoHeight)
    } catch (e) {
      console.error('Failed to add logo image:', e)
    }
  }
  
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.text(titleText, titleX, titleY, { align: 'center' })
  
  pdf.setFontSize(14)
  pdf.text(SKYSHIP_CONFIG.name, pageWidth / 2, currentY + 15, { align: 'center' })
  
  pdf.setFontSize(11)
  pdf.text(title, pageWidth / 2, currentY + 21, { align: 'center' })

  // Right: Barcode and Waybill Number
  const barcodeCanvas = document.createElement('canvas')
  const barcodeValue = (data.waybillNumber || data.consignmentNumber || 'UNKNOWN').toString()
  JsBarcode(barcodeCanvas, barcodeValue, {
    format: 'CODE128',
    width: 1.5,
    height: 30,
    displayValue: false,
    margin: 0,
  })
  const barcodeDataUrl = barcodeCanvas.toDataURL('image/png')
  
  const barcodeWidth = 70
  const barcodeHeight = 18
  const barcodeX = pageWidth - margin - barcodeWidth - 5
  const barcodeY = currentY + 2
  
  // Waybill Number above barcode
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('WAYBILL NUMBER:', barcodeX, barcodeY - 1)
  
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(11)
  pdf.text(barcodeValue, barcodeX, barcodeY + 4)
  
  // Barcode image
  pdf.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY + 7, barcodeWidth, barcodeHeight)

  currentY += headerHeight + 4

  // ========== ROW 1: Shipper | Consignee | Routing ==========
  const row1Height = 42
  const colWidth = contentWidth / 3
  
  // Helper to draw section box
  const drawSection = (x: number, y: number, w: number, h: number, title: string, lines: { label: string; value: string }[]) => {
    // Border
    pdf.setDrawColor(COLORS.border)
    pdf.setLineWidth(0.5)
    pdf.rect(x, y, w, h)
    
    // Title background
    pdf.setFillColor(COLORS.primary)
    pdf.rect(x, y, w, 7, 'F')
    
    // Title text
    pdf.setTextColor(COLORS.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(title.toUpperCase(), x + 3, y + 5)
    
    // Content lines
    let lineY = y + 12
    pdf.setFontSize(8)
    
    lines.forEach(line => {
      if (lineY < y + h - 3) {
        // Label
        pdf.setTextColor(COLORS.textLight)
        pdf.setFont('helvetica', 'bold')
        pdf.text(line.label, x + 3, lineY)
        
        // Value
        const labelWidth = pdf.getTextWidth(line.label)
        const valueX = x + 3 + labelWidth + 2
        const valueMaxWidth = Math.max(10, w - (valueX - x) - 3)
        const remainingHeight = Math.max(3, y + h - 3 - lineY)
        pdf.setTextColor(COLORS.textDark)
        pdf.setFont('courier', 'bold')
        pdf.setFontSize(8)
        const usedLines = drawWrappedClampedText(line.value || 'N/A', valueX, lineY, valueMaxWidth, remainingHeight, 3.5)

        lineY += Math.max(6, usedLines * 3.5 + 2)
      }
    })
  }

  // Column 1: Shipper (FROM)
  drawSection(
    margin,
    currentY,
    colWidth,
    row1Height,
    'Shipper (From)',
    [
      { label: 'Name:', value: data.senderName || 'N/A' },
      { label: 'Address:', value: data.senderAddress || 'N/A' },
      { label: 'Phone:', value: data.senderPhone || data.senderTelephone || 'N/A' },
      { label: 'Account:', value: data.senderAccountNo || data.accountNumber || 'N/A' },
    ]
  )

  // Column 2: Consignee (TO)
  drawSection(
    margin + colWidth,
    currentY,
    colWidth,
    row1Height,
    'Consignee (To)',
    [
      { label: 'Name:', value: data.receiverName || 'N/A' },
      { label: 'Address:', value: data.receiverAddress || 'N/A' },
      { label: 'Phone:', value: data.receiverPhone || data.receiverTelephone || 'N/A' },
      { label: 'City:', value: data.receiverCity || 'N/A' },
    ]
  )

  // Column 3: Routing & Destination
  const departure = data.portOfDeparture || data.airportOfDeparture || 'LAGOS/LOS'
  const destination = data.portOfDestination || data.airportOfDestination || 'N/A'
  const departureDate = data.departureDate || new Date().toISOString().split('T')[0]
  
  drawSection(
    margin + colWidth * 2,
    currentY,
    colWidth,
    row1Height,
    'Routing & Destination',
    [
      { label: 'Departure:', value: departure },
      { label: 'Destination:', value: destination },
      { label: 'Date:', value: departureDate },
      { label: 'Route:', value: data.routeNumber || 'N/A' },
    ]
  )

  currentY += row1Height

  // ========== ROW 2: Description (wide) | Charges (side) ==========
  const row2Height = 55
  const descWidth = contentWidth * 0.65
  const chargesWidth = contentWidth - descWidth

  // Description of Goods Table
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, currentY, descWidth, row2Height)
  
  // Table header
  pdf.setFillColor(COLORS.primary)
  pdf.rect(margin, currentY, descWidth, 8, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('DESCRIPTION OF GOODS', margin + 3, currentY + 6)
  
  // Table columns
  const tableY = currentY + 8
  const colWidths = [15, 20, 80, 25, 35] // No, Type, Description, Weight, Dimensions
  const tableHeaders = ['No.', 'Type', 'Description', 'Weight', 'Dimensions']
  
  // Header row
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, tableY, descWidth, 7, 'F')
  
  let colX = margin + 2
  pdf.setFontSize(8)
  tableHeaders.forEach((header, idx) => {
    pdf.setTextColor(COLORS.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.text(header, colX, tableY + 5)
    colX += colWidths[idx]
  })
  
  // Table data rows
  const items = data.items || data.waybillItems || []
  let rowY = tableY + 7
  
  if (items.length === 0) {
    // Empty row
    pdf.setTextColor(COLORS.textLight)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    pdf.text('No items added', margin + 5, rowY + 8)
  } else {
    items.slice(0, 4).forEach((item: any, index: number) => {
      if (index > 0) {
        pdf.setDrawColor(COLORS.border)
        pdf.setLineWidth(0.3)
        pdf.line(margin, rowY, margin + descWidth, rowY)
      }
      
      pdf.setTextColor(COLORS.textDark)
      pdf.setFont('courier', 'bold')
      pdf.setFontSize(8)
      
      let cellX = margin + 2
      
      // No. of Pcs
      const noOfPcs = item.noOfPcs || item.pieces || item.quantity || 1
      pdf.text(String(noOfPcs), cellX + 2, rowY + 5)
      cellX += colWidths[0]
      
      const rowTopY = rowY + 1
      const rowTextHeight = 8

      // Type
      const typeOfPkg = item.typeOfPkg || 'Box'
      drawWrappedClampedText(String(typeOfPkg), cellX, rowTopY + 3.5, colWidths[1] - 2, rowTextHeight, 3.2)
      cellX += colWidths[1]
      
      // Description
      const desc = item.description || item.cargoDescription || data.contents || 'N/A'
      drawWrappedClampedText(String(desc), cellX, rowTopY + 3.5, colWidths[2] - 2, rowTextHeight, 3.2)
      cellX += colWidths[2]
      
      // Weight
      const weight = item.grossWeight || item.weight || 0
      pdf.text(`${weight} kg`, cellX + 2, rowY + 5)
      cellX += colWidths[3]
      
      // Dimensions
      const dims = item.dimensions || {}
      const dimText = `${dims.length || 0}×${dims.width || 0}×${dims.height || 0}`
      drawWrappedClampedText(dimText, cellX, rowTopY + 3.5, colWidths[4] - 2, rowTextHeight, 3.2)
      
      rowY += 10
    })
  }
  
  // Vertical lines for table columns
  let lineX = margin
  colWidths.forEach((width) => {
    lineX += width
    pdf.setDrawColor(COLORS.border)
    pdf.setLineWidth(0.3)
    pdf.line(lineX, tableY, lineX, currentY + row2Height)
  })

  // Charges & Fees Box (right side)
  const chargesX = margin + descWidth
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(chargesX, currentY, chargesWidth, row2Height)
  
  // Charges header
  pdf.setFillColor(COLORS.primary)
  pdf.rect(chargesX, currentY, chargesWidth, 8, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('CHARGES & FEES (USD)', chargesX + 3, currentY + 6)
  
  // Calculate charges
  const totalWeight = items.reduce((sum: number, item: any) => sum + (item.grossWeight || item.weight || 0), 0)
  const baseFreight = data.baseFreight || Math.round((totalWeight * 2.5) * 100) / 100
  const insurance = data.insurance || Math.round((totalWeight * 0.8) * 100) / 100
  const tax = data.airportTaxVat || Math.round((totalWeight * 0.5 + 5) * 100) / 100
  const duty = data.destinationDuty || Math.round((totalWeight * 0.6) * 100) / 100
  const total = Math.round((baseFreight + insurance + tax + duty) * 100) / 100
  
  // Charges list
  const charges = [
    { label: 'Base Freight:', value: `$${baseFreight.toFixed(2)}` },
    { label: 'Insurance:', value: `$${insurance.toFixed(2)}` },
    { label: 'Airport Tax/VAT:', value: `$${tax.toFixed(2)}` },
    { label: 'Dest. Duty:', value: `$${duty.toFixed(2)}` },
  ]
  
  let chargeY = currentY + 15
  pdf.setFontSize(9)
  
  charges.forEach(charge => {
    pdf.setTextColor(COLORS.textLight)
    pdf.setFont('helvetica', 'bold')
    pdf.text(charge.label, chargesX + 5, chargeY)
    
    pdf.setTextColor(COLORS.textDark)
    pdf.setFont('courier', 'bold')
    pdf.text(charge.value, chargesX + chargesWidth - 5, chargeY, { align: 'right' })
    
    chargeY += 8
  })
  
  // Total line
  pdf.setDrawColor(COLORS.secondary)
  pdf.setLineWidth(0.5)
  pdf.line(chargesX + 5, chargeY, chargesX + chargesWidth - 5, chargeY)
  
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('TOTAL:', chargesX + 5, chargeY + 6)
  
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(12)
  pdf.text(`$${total.toFixed(2)}`, chargesX + chargesWidth - 5, chargeY + 6, { align: 'right' })

  currentY += row2Height

  // ========== ROW 3: Shipment Total | Note ==========
  const row3Height = 26
  const halfWidth = contentWidth / 2

  // Shipment Totals (Left)
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, currentY, halfWidth, row3Height)
  
  pdf.setFillColor(COLORS.primary)
  pdf.rect(margin, currentY, halfWidth, 7, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('SHIPMENT TOTALS', margin + 3, currentY + 5)
  
  const totalPieces = items.reduce((sum: number, item: any) => sum + (item.noOfPcs || item.pieces || item.quantity || 1), 0)
  
  pdf.setTextColor(COLORS.textLight)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(`Total Pieces: ${totalPieces}`, margin + 5, currentY + 14)
  pdf.text(`Total Weight: ${totalWeight.toFixed(2)} KG`, margin + 5, currentY + 21)

  // NOTE Box (Center) - Special Instructions/Handling
  const noteX = margin + halfWidth
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(noteX, currentY, halfWidth, row3Height)
  
  pdf.setFillColor(COLORS.primary)
  pdf.rect(noteX, currentY, halfWidth, 7, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('NOTE', noteX + 3, currentY + 5)
  
  const handlingText = data.handlingInformation || data.specialInstructions || 'No special handling required'
  const noteDividerX = noteX + halfWidth / 2

  // Split NOTE box into two vertical sections.
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.3)
  pdf.line(noteDividerX, currentY + 7, noteDividerX, currentY + row3Height)

  pdf.setTextColor(COLORS.textDark)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  drawWrappedClampedText(
    handlingText,
    noteX + 3,
    currentY + 12,
    halfWidth / 2 - 8,
    row3Height - 11,
    3.2
  )

  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('TERMS AND CONDITIONS', noteDividerX + 3, currentY + 12)

  const termsBody = 'Received in apparent good order unless otherwise noted. Subject to the terms and conditions of the Carrier\'s Service Guide. Liability is limited as per the back of this document or applicable law. All claims for loss or damage must be filed within 14 days.'
  pdf.setTextColor(COLORS.textDark)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  drawWrappedClampedText(
    termsBody,
    noteDividerX + 3,
    currentY + 16,
    halfWidth / 2 - 8,
    row3Height - 10,
    2.8
  )
  
  // Dangerous goods checkbox stays in the left section of NOTE box.
  const checkboxY = currentY + row3Height - 6
  pdf.setDrawColor(COLORS.secondary)
  pdf.setLineWidth(0.5)
  pdf.rect(noteX + 3, checkboxY, 3, 3)
  
  if (data.isDangerousGoods) {
    pdf.setTextColor(COLORS.secondary)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.text('✓', noteX + 4, checkboxY + 2)
  }
  
  pdf.setTextColor(COLORS.textLight)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7)
  pdf.text('DANGEROUS GOODS', noteX + 9, checkboxY + 2)

  currentY += row3Height

  // ========== ROW 4: Signatures | Terms ==========
  const row4Height = 30
  const sigColWidth = contentWidth / 3

  // Shipper Signature
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, currentY, sigColWidth, row4Height)
  
  pdf.setFillColor(COLORS.primary)
  pdf.rect(margin, currentY, sigColWidth, 7, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('SHIPPER SIGNATURE', margin + 3, currentY + 5)
  
  // Try to add signature image - REMOVED the line that cuts across
  const signatureImage = await loadImageAsDataURL('/SENDER\'S SIGNATURE.png')
  if (signatureImage) {
    try {
      pdf.addImage(signatureImage, 'PNG', margin + 5, currentY + 10, sigColWidth - 10, 12)
    } catch (e) {
      console.error('Failed to add signature image:', e)
    }
  } else {
    // REMOVED: pdf.line(margin + 10, currentY + 20, margin + sigColWidth - 10, currentY + 20)
    pdf.setTextColor(COLORS.textLight)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.text('[Signature]', margin + sigColWidth/2 - 8, currentY + 20)
  }

  // Carrier Agent - with FIATA Logo and Terms Text
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(margin + sigColWidth, currentY, sigColWidth, row4Height)
  
  pdf.setFillColor(COLORS.primary)
  pdf.rect(margin + sigColWidth, currentY, sigColWidth, 7, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('CARRIER AUTHORIZED AGENT', margin + sigColWidth + 3, currentY + 5)
  
  // Add FIATA Logo inside the carrier agent box.
  const fiataImage = await loadImageAsDataURL('/FIATA LOGO RESIZED.png')
  const fiataWidth = 22
  const fiataHeight = 14
  const fiataX = margin + sigColWidth + (sigColWidth - fiataWidth) * 0.65
  const fiataY = currentY + 9
  if (fiataImage) {
    try {
      pdf.addImage(fiataImage, 'PNG', fiataX, fiataY, fiataWidth, fiataHeight)
    } catch (e) {
      console.error('Failed to add FIATA logo:', e)
    }
  }
  
  // Keep write-up between logo and bottom border with safe padding.
  pdf.setTextColor(COLORS.textDark)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6)
  const fiataText = 'I/WE AGREE THAT FIATA STANDARD TERMS APPLY TO THIS SHIPMENT'
  const fiataTextStartY = fiataY + fiataHeight + 3
  drawWrappedClampedText(
    fiataText,
    margin + sigColWidth + 3,
    fiataTextStartY,
    sigColWidth - 8,
    row4Height - (fiataTextStartY - currentY) - 2,
    3
  )

  // Date
  pdf.setDrawColor(COLORS.border)
  pdf.setLineWidth(0.5)
  pdf.rect(margin + sigColWidth * 2, currentY, sigColWidth, row4Height)
  
  pdf.setFillColor(COLORS.primary)
  pdf.rect(margin + sigColWidth * 2, currentY, sigColWidth, 7, 'F')
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('DATE', margin + sigColWidth * 2 + 3, currentY + 5)
  
  const currentDate = new Date().toISOString().split('T')[0]
  pdf.setTextColor(COLORS.textDark)
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(10)
  pdf.text(currentDate, margin + sigColWidth * 2 + 5, currentY + 20)

  // Footer - REMOVED BLUE LINE that was cutting across signature boxes
  const footerY = pageHeight - footerBottomMargin
  
  // Only show copyright text without the blue line
  pdf.setTextColor(COLORS.secondary)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('© 2026 Skyship Logistics. All rights reserved.', margin, footerY)
  
  pdf.setTextColor(COLORS.textLight)
  pdf.text('For tracking: skyshiplogistics.com/track', pageWidth - margin, footerY, { align: 'right' })

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
      link.download = `waybill_${data.waybillNumber || data.consignmentNumber}.pdf`
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
