export const GREENHILLS_CONFIG = {
  name: 'Greenhills Chemicals Incorporated',
  logo: 'https://placeholder.com/logo-greenhills.png',
  phone: '+44 7935 244329',
  address: 'GOLDEN CROSS HOUSE, 456-458 STRAND'
} as const

export const SKYDEX_CONFIG = {
  name: 'SKYDEX Logistics',
  logo: '/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png',
  phone: '+44 7935 244329',
  address: 'GOLDEN CROSS HOUSE, 456-458 STRAND'
} as const

// Keep old name for backward compatibility
export const SKYSHIP_CONFIG = SKYDEX_CONFIG

// Company contact information for use across all pages
export const COMPANY_CONTACT = {
  phone: '+44 7935 244329',
  address: 'GOLDEN CROSS HOUSE, 456-458 STRAND',
  email: 'contact@skydexlogistics.com'
} as const

export function generateTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let random = ''
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const year = new Date().getFullYear()
  return `SKY-${random}-${year}`
}
