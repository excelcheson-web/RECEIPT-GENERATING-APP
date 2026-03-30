'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function TrackPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim()}`)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 mesh-gradient" />

      {/* Glassmorphic Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav-10px">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 lg:px-8">
          {/* Logo - Fixed margins for mobile */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-lg shadow-[#9DC400]/30 flex-shrink-0">
              <Image
                src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                alt="Skyship Logistics Logo"
                fill
                className="object-cover"
                sizes="64px"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-high-contrast whitespace-nowrap">
              Skyship Logistics
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="nav-link text-sm">{t.nav.home}</Link>
            <Link href="/about" className="nav-link text-sm">{t.nav.about}</Link>
            <Link href="/services" className="nav-link text-sm">{t.nav.services}</Link>
            <Link href="/track" className="nav-link text-sm text-[#9DC400]">{t.nav.track}</Link>
            <Link href="/contact" className="nav-link text-sm">{t.nav.contact}</Link>
          </nav>

          {/* Right Side: Language + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              {/* LanguageSwitcher would go here - simplified for now */}
            </div>
            
            {/* Mobile Menu Button - Now Functional */}
            <button 
              className="md:hidden glass-button p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel mx-3 mt-2 p-4 rounded-xl">
            <nav className="flex flex-col gap-2">
              <Link 
                href="/" 
                className="nav-link text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.home}
              </Link>
              <Link 
                href="/about" 
                className="nav-link text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.about}
              </Link>
              <Link 
                href="/services" 
                className="nav-link text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.services}
              </Link>
              <Link 
                href="/track" 
                className="nav-link text-sm py-2 text-[#9DC400]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.track}
              </Link>
              <Link 
                href="/contact" 
                className="nav-link text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.contact}
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content - Track Parcel Form */}
      <main className="relative pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <div className="hero-glass-panel p-6 sm:p-10 lg:p-12 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden bg-[#9DC400]/20 flex items-center justify-center">
              <Image 
                src="https://images.unsplash.com/photo-1607344649296-a261e3e4b5bf?w=100&q=80" 
                alt="Track Package" 
                width={80} 
                height={80} 
                className="object-cover w-full h-full"
              />
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-high-contrast mb-4">
              {t.nav.track}
            </h1>
            
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              Enter your tracking number to get real-time updates on your shipment status.
            </p>
            
            {/* Tracking Form */}
            <form onSubmit={handleTrack} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t.hero.placeholder}
                  className="glass-input flex-1 text-base glass-input-lime text-center sm:text-left"
                />
                <button
                  type="submit"
                  className="skyship-button px-8 py-3 whitespace-nowrap font-bold"
                >
                  {t.hero.trackButton}
                </button>
              </div>
              <p className="text-white/60 text-xs mt-4">
                {t.hero.example}
              </p>
            </form>

            {/* Back to Home */}
            <div className="mt-8">
              <Link 
                href="/" 
                className="text-white/60 hover:text-white text-sm transition inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
