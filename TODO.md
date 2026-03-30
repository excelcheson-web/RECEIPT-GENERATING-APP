# Receipt Template Fixes - COMPLETED

## Tasks Completed ✓

- [x] 1. ~~Download and add Courier Prime font files~~ - Using standard 'courier' font (jsPDF native)
- [x] 2. Fix watermark opacity to 0.02 using canvas pre-processing
- [x] 3. Increase amount in words spacing (prevent touching line above)
- [x] 4. Reduce gap between signature/stamp and receipt description
- [x] 5. Update DocumentTemplate.tsx with all fixes
- [x] 6. **NEW:** Financial Summary Box with dedicated Amount in Words container and padding

## Changes Made

### 1. Watermark Opacity Fix (0.02)
- Added `createWatermarkImage()` helper function using HTML Canvas API
- Pre-processes watermark image with 0.02 opacity (2% visibility)
- Increased watermark size to 150x150mm for larger imprint
- Positioned diagonally (45°) across center of document

### 2. Amount in Words Spacing
- Changed spacing from `y += 18` to `y += 28` after grand total
- Provides 10mm additional space to prevent touching the line above
- Color remains black (0, 0, 0) as required

### 3. Reduced Gap Between Sections
- Changed spacing from `y += 50` to `y += 35` between receipt description and signature/stamp
- Reduced gap by 15mm (30% reduction) for tighter layout

### 4. Font Usage
- All text uses 'courier' font (standard jsPDF monospace font)
- Company name "Greenhills Chemicals Incorporated" uses 'helvetica' in Teal color
- **Note:** Courier Prime requires custom font loading in jsPDF which needs additional setup with base64-encoded font files

### 5. Financial Summary Box - Amount in Words Container (NEW)
- Created dedicated container for "Amount in Words" text block within the financial summary box
- Applied internal padding of 3mm on all sides (safe zone)
- Added light gray background (250, 250, 250) for visual separation
- Enabled text wrapping with constrained width to fit within padded area
- Text positioned with proper offset to maintain left alignment within safe zone
- Container height set to 25mm with proper spacing from Grand Total line above
- Font size reduced to 9pt for better fit within container

## Already Implemented (No Changes Needed)
- ✓ Company name: "Greenhills Chemicals Incorporated" in Teal color (0, 128, 128)
- ✓ Amount in words: Black color
- ✓ Mode of transfer & receipt description: Boxed layout with vertical divider
- ✓ Font: 'courier' for all text except company name

---

# Company Contact Information Updates - COMPLETED

## New Contact Details
- **Phone:** +44 7935 244329
- **Address:** GOLDEN CROSS HOUSE, 456-458 STRAND
- **Email:** contact@skydexlogistics.com

## Files Updated

### 1. Constants (`logistics-portal/src/lib/constants.ts`)
- Added `COMPANY_CONTACT` export with all contact details
- Updated `GREENHILLS_CONFIG` with correct company name and contact info
- Updated `SKYDEX_CONFIG` with phone and address fields

### 2. Home Page (`logistics-portal/src/app/page.tsx`)
- Updated WhatsApp link to use new phone number (+44 7935 244329)
- Fixed LanguageSwitcher visibility on mobile (removed `hidden sm:block`)
- Added LanguageSwitcher to mobile menu and hero section

### 3. Contact Page (`logistics-portal/src/app/contact/page.tsx`)
- Updated to 4-column grid layout
- Added new email: contact@skydexlogistics.com
- Added new phone: +44 7935 244329
- Added new address: GOLDEN CROSS HOUSE, 456-458 STRAND

### 4. About Page (`logistics-portal/src/app/about/page.tsx`)
- Updated footer contact section with new phone, email, and address

### 5. Legal & Support Pages
- **Cookies** (`cookies/page.tsx`): Updated phone to +44 7935 244329
- **Terms** (`terms/page.tsx`): Updated email to legal@skydexlogistics.com, phone to +44 7935 244329
- **Privacy** (`privacy/page.tsx`): Updated DPO contact details with new phone and address
- **Chat** (`chat/page.tsx`): Updated AI response and footer with new contact info
- **FAQs** (`faqs/page.tsx`): Updated customer support contact information
- **Admin** (`admin/page.tsx`): Updated phone placeholder to +44 7935 244329

## Summary
All company contact information has been standardized across the logistics portal with the new UK-based contact details.
