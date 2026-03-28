'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const languages = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Español' },
  { code: 'FR', name: 'Français' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'CN', name: '中文' },
  { code: 'AR', name: 'العربية' },
]

// Icon components to replace emojis
const DiamondIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-400">
    <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
    <path d="M11 3L8 9l4 13 4-13-3-6z"/>
    <path d="M2 9h20"/>
  </svg>
)

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-orange-400">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)

const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-cyan-400">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-400">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-400">
    <path d="M6 22h12a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/>
    <path d="M14 2v5a2 2 0 0 0 2 2h5"/>
    <path d="M10 9h4"/>
    <path d="M10 13h4"/>
    <path d="M10 17h4"/>
  </svg>
)

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-yellow-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-orange-400">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const NetworkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400">
    <circle cx="12" cy="5" r="3"/>
    <circle cx="19" cy="8" r="3"/>
    <circle cx="5" cy="8" r="3"/>
    <circle cx="12" cy="19" r="3"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="9" y1="7" x2="6" y2="9"/>
    <line x1="15" y1="7" x2="18" y2="9"/>
    <line x1="9" y1="17" x2="7" y2="15"/>
    <line x1="15" y1="17" x2="17" y2="15"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-400">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-400 inline mr-2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-400 inline mr-2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400 inline mr-2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const priorities = [
  {
    title: 'Customer Centricity',
    description: "We don't just deliver packages; we deliver peace of mind.",
    Icon: DiamondIcon
  },
  {
    title: 'Innovation',
    description: 'We leverage the latest in AI and digital tracking to stay ahead of the curve.',
    Icon: RocketIcon
  },
  {
    title: 'Sustainability',
    description: 'We are constantly optimizing our routes to reduce our carbon footprint and build a greener future for global trade.',
    Icon: LeafIcon
  },
  {
    title: 'Global Connectivity',
    description: 'Bridging the gap between global markets and local doorsteps with transparent logistics.',
    Icon: GlobeIcon
  }
]

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="mesh-gradient min-h-screen">
      {/* Header & Navigation */}
      <header className="glass-header px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image
                src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                alt="SKYDEX Logo"
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <span className="text-xl font-bold text-white text-high-contrast hidden sm:block">
              SKYDEX
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white/80 hover:text-white transition font-medium">
              {t.nav.home}
            </Link>
            <Link href="/about" className="text-white/80 hover:text-white transition font-medium">
              {t.nav.about}
            </Link>
            <Link href="/#services" className="text-white/80 hover:text-white transition font-medium">
              {t.nav.services}
            </Link>
            <Link href="/#track" className="text-white/80 hover:text-white transition font-medium">
              {t.nav.track}
            </Link>
            <Link href="/#contact" className="text-white/80 hover:text-white transition font-medium">
              {t.nav.contact}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-high-contrast mb-6 tracking-tight">
              About SKYDEX
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-blue-500 mx-auto rounded-full"></div>
          </div>

          {/* Vision Section */}
          <div className="glass-panel p-8 sm:p-12 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <TargetIcon />
              Our Vision: Transparent Global Connectivity
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              At SKYDEX, we believe that moving cargo should be as seamless as a clear sky. 
              In an increasingly complex world, we provide a "glass-box" approach to logistics—where 
              every movement is visible, every milestone is tracked, and every client is empowered with 
              real-time data. We aren&apos;t just moving parcels; we are bridging the gap between global 
              markets and local doorsteps.
            </p>
          </div>

          {/* Who We Are Section */}
          <div className="glass-panel p-8 sm:p-12 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <BuildingIcon />
              Who We Are
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Founded on the principles of precision, speed, and integrity, SKYDEX has grown 
              into a premier international freight and supply chain partner. From the intricate requirements 
              of Air and Ocean Freight to the ground-level reliability of Road Freight and Warehousing, 
              our infrastructure is built to handle the world&apos;s most demanding cargo.
            </p>
          </div>

          {/* Why Choose SKYDEX Section */}
          <div className="glass-panel p-8 sm:p-12 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <StarIcon />
              Why Choose SKYDEX?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LocationIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Precision Tracking</h3>
                  <p className="text-white/70">Our proprietary interface allows you to monitor your shipments with minute-by-minute accuracy.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <NetworkIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Global Reach, Local Expertise</h3>
                  <p className="text-white/70">With a presence in key international hubs, we navigate customs and regional regulations so you don&apos;t have to.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ZapIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Adaptive Solutions</h3>
                  <p className="text-white/70">Whether it&apos;s a single parcel or a massive industrial shipment, our logistics architecture scales to meet your specific needs.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LockIcon />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Security First</h3>
                  <p className="text-white/70">Your cargo is protected by industry-leading safety protocols and a dedicated team of logistics professionals.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prime Priorities Section */}
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 flex items-center justify-center gap-3">
              <TargetIcon />
              Our Prime Priorities
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {priorities.map((priority, index) => (
                <div 
                  key={index}
                  className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300"
                >
                  <div className="mb-4 group-hover:scale-110 transition-transform flex justify-center">
                    <priority.Icon />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {priority.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {priority.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-footer px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                  <Image
                    src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                    alt="SKYDEX Logo"
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <span className="text-xl font-bold text-white">SKYDEX</span>
              </div>
              <p className="text-white/60 text-sm">
                Transparent Global Connectivity for your cargo needs.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/#services" className="hover:text-white transition">Services</Link></li>
                <li><Link href="/#track" className="hover:text-white transition">Track Parcel</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="#" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Staff</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/staff" className="hover:text-white transition">Staff Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-center"><MailIcon /> info@skydex.com</li>
                <li className="flex items-center"><PhoneIcon /> +1 (555) 123-4567</li>
                <li className="flex items-center"><MapPinIcon /> Global Headquarters</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/50 text-sm">
              © 2026 SKYDEX Logistics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
