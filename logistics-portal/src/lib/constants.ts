export const GREENHILLS_CONFIG = {
  name: 'Greenhills Chemical Incorporation',
  logo: 'https://placeholder.com/logo-greenhills.png'
} as const

export const SKYDEX_CONFIG = {
  name: 'SKYDEX Logistics',
  logo: '/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png'
} as const

// Keep old name for backward compatibility
export const SKYSHIP_CONFIG = SKYDEX_CONFIG

export function generateTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let random = ''
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const year = new Date().getFullYear()
  return `SKY-${random}-${year}`
}
