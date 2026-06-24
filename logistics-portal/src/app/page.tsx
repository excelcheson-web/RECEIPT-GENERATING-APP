'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import BackgroundSlideshow from '@/components/BackgroundSlideshow'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

// Service data with detailed descriptions
const services = [
  {
    id: 'air',
    title: 'Air Freight',
    shortDesc: 'Speed Without Compromise',
    description: 'When time is your most valuable asset, Skyship Logistics\'s Air Freight solutions deliver. We leverage a global network of premium air carriers to ensure your high-priority cargo reaches any destination worldwide in record time. From express documents to heavy industrial machinery, we handle the complexity of customs and clearance so you don\'t have to.',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=200&q=80',
  },
  {
    id: 'ocean',
    title: 'Ocean Freight',
    shortDesc: 'Global Reach, Scalable Solutions',
    description: 'For large-scale international trade, our Ocean Freight service offers the perfect balance of cost-efficiency and reliability. Whether you require Full Container Load (FCL) or Less than Container Load (LCL), Skyship Logistics provides secure transit across all major sea lanes, backed by our real-time maritime tracking interface.',
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=200&q=80',
  },
  {
    id: 'warehouse',
    title: 'Warehousing',
    shortDesc: 'Smart Storage & Inventory Control',
    description: 'Our state-of-the-art warehousing facilities are more than just storage; they are strategic hubs for your supply chain. Featuring climate-controlled environments and advanced Inventory Management Systems (IMS), we ensure your goods are sorted, protected, and ready for rapid distribution the moment they are needed.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=200&q=80',
  },
  {
    id: 'road',
    title: 'Road Freight',
    shortDesc: 'Last-Mile Precision',
    description: 'The final link in the chain is often the most critical. Our Road Freight network spans continents, providing door-to-door delivery with a fleet of modern, GPS-tracked vehicles. From regional distribution to cross-border trucking, we ensure your parcel navigates the "last mile" with total transparency and safety.',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=200&q=80',
  },
]

// Prime Priorities data with real images
const priorities = [
  {
    title: 'Customer Centricity',
    description: "We don't just deliver packages; we deliver peace of mind.",
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80'
  },
  {
    title: 'Innovation',
    description: 'We leverage the latest in AI and digital tracking to stay ahead of the curve.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80'
  },
  {
    title: 'Sustainability',
    description: 'We are constantly optimizing our routes to reduce our carbon footprint and build a greener future for global trade.',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80'
  },
  {
    title: 'Global Connectivity',
    description: 'Bridging the gap between global markets and local doorsteps with transparent logistics.',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&q=80'
  }
]

// Testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Supply Chain Manager',
    company: 'TechCorp Inc.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    text: 'Skyship Logistics has transformed our supply chain. Their real-time tracking and reliable delivery times have helped us improve customer satisfaction by 40%.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Operations Director',
    company: 'Global Trade Co.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    text: 'The best logistics partner we have worked with. Their air freight service is exceptional, and their customer support is available 24/7.',
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'CEO',
    company: 'FastRetail Ltd.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    text: 'Their warehousing solutions have reduced our operational costs significantly. The inventory management system is top-notch and easy to use.',
  },
  {
    id: 4,
    name: 'David Martinez',
    role: 'Import/Export Manager',
    company: 'Martinez Trading',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    text: 'Ocean freight services are reliable and cost-effective. They handle all customs documentation professionally, making international shipping hassle-free.',
  },
]
import { COMPANY_CONTACT } from '@/lib/constants'

export default function Home() {
  const whatsappHref = `https://wa.me/${COMPANY_CONTACT.phone.replace(/\D/g, '')}`

  const router = useRouter()
  const { t } = useTranslation()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim()}`)
    }
  }

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="min-h-screen relative">
      {/* Full-bleed Background Slideshow */}
      <BackgroundSlideshow />

      {/* Glassmorphic Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav-10px">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 lg:px-8">
          {/* Logo - Fixed for mobile */}
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
            <a href="#services" className="nav-link text-sm">{t.nav.services}</a>
            <Link href="/track" className="nav-link text-sm">{t.nav.track}</Link>
            <a href="/contact" className="nav-link text-sm">{t.nav.contact}</a>
          </nav>

          {/* Right Side: Language + Profile + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher - Now visible on all screen sizes */}
            <LanguageSwitcher />
            
            {/* IM Avatar Icon */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#9DC400] to-[#7A9A00] flex items-center justify-center text-[#001f3f] font-bold text-xs sm:text-sm shadow-lg shadow-[#9DC400]/30">
              IM
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

        {/* Mobile Menu Dropdown with Backdrop Blur */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay that blurs the background */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <div className="md:hidden glass-panel mx-3 mt-2 p-4 rounded-xl relative z-50">
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
                <a 
                  href="#services" 
                  className="nav-link text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.services}
                </a>
                <Link 
                  href="/track" 
                  className="nav-link text-sm py-2 text-[#9DC400]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.track}
                </Link>
                <a 
                  href="/contact" 
                  className="nav-link text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.nav.contact}
                </a>
                {/* Language Switcher in Mobile Menu */}
                <div className="border-t border-white/20 pt-2 mt-2">
                  <span className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Language</span>
                  <LanguageSwitcher />
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Hero Section - NOW USING TRANSLATIONS */}
      <section id="track" className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="hero-glass-panel p-5 sm:p-10 lg:p-16 max-w-3xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white text-high-contrast mb-4 sm:mb-6 leading-tight">
              {t.hero.title1}{' '}
              <span className="text-[#9DC400]">
                {t.hero.title2}
              </span>
            </h1>

            {/* Descriptive Text */}
            <p className="text-base sm:text-xl text-white/90 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              {t.hero.description}
            </p>
            
            {/* Glass Input Panel for Tracking */}
            <form onSubmit={handleTrack} className="glass-panel p-4 sm:p-8 rounded-2xl max-w-xl mx-auto">
              <label className="block text-white/90 text-sm mb-4 font-medium text-left">
                {t.hero.trackingLabel}
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t.hero.placeholder}
                  className="glass-input flex-1 text-base glass-input-lime"
                />
                <button
                  type="submit"
                  className="skyship-button px-8 py-3 whitespace-nowrap font-bold"
                >
                  {t.hero.trackButton}
                </button>
              </div>
              <p className="text-white/60 text-xs mt-4 text-left">
                {t.hero.example}
              </p>
            </form>

            {/* Floating Live Tracking Indicator */}
            <div className="mt-8 flex justify-center">
              <div className="live-tracking-indicator">
                <span className="live-dot"></span>
                <span className="text-white/90 text-sm font-medium">{t.hero.liveTracking}</span>
                <svg className="w-4 h-4 text-[#9DC400] ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the page remains the same for now - we'll update section by section */}
      {/* Company Identity Section */}
      <section id="identity" className="py-10 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white text-high-contrast mb-4">
              {t.identity.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
              {t.identity.subtitle}
            </p>
          </div>

          {/* Three Identity Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Our Mission Card */}
            <div className="company-identity-card">
              <div className="identity-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                  <line x1="12" y1="2" x2="12" y2="4"/>
                  <line x1="12" y1="20" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="4" y2="12"/>
                  <line x1="20" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
              <h3 className="identity-heading">{t.identity.mission.title}</h3>
              <p className="identity-text">
                {t.identity.mission.text}
              </p>
            </div>

            {/* Our Vision Card */}
            <div className="company-identity-card">
              <div className="identity-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                  <line x1="12" y1="5" x2="12" y2="3"/>
                  <line x1="17.5" y1="6.5" x2="19" y2="5"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="17.5" y1="17.5" x2="19" y2="19"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="6.5" y1="17.5" x2="5" y2="19"/>
                  <line x1="3" y1="12" x2="1" y2="12"/>
                  <line x1="6.5" y1="6.5" x2="5" y2="5"/>
                </svg>
              </div>
              <h3 className="identity-heading">{t.identity.vision.title}</h3>
              <p className="identity-text">
                {t.identity.vision.text}
              </p>
            </div>

            {/* Core Values Card */}
            <div className="company-identity-card">
              <div className="identity-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
                  <path d="M12 22V8"/>
                  <path d="M12 8 7.5 3"/>
                  <path d="m12 8 4.5-5"/>
                  <path d="M2 9h20"/>
                </svg>
              </div>
              <h3 className="identity-heading">{t.identity.values.title}</h3>
              <ul className="core-values-list">
                <li>{t.identity.values.transparency}</li>
                <li>{t.identity.values.speed}</li>
                <li>{t.identity.values.tech}</li>
                <li>{t.identity.values.responsibility}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Service Modules Section */}
      <section id="services" className="py-10 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white text-high-contrast mb-4">
              {t.services.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
              {t.services.subtitle}
            </p>
            <Link 
              href="/services" 
              className="skyship-button px-6 py-3 inline-block"
            >
              {t.services.viewAll}
            </Link>
          </div>

          {/* Horizontal Service Images */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href="/services"
                className="glass-card overflow-hidden group cursor-pointer relative h-44 sm:h-56 lg:h-64"
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="relative w-12 h-12 mb-2 rounded-lg overflow-hidden border-2 border-[#9DC400]">
                    <Image
                      src={service.iconImage}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {((t.services as unknown) as Record<string, { title: string }>)[service.id]?.title || service.title}
                  </h3>
                  <p className="text-[#9DC400] text-sm font-semibold">
                    {((t.services as unknown) as Record<string, { shortDesc: string }>)[service.id]?.shortDesc || service.shortDesc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prime Priorities Section */}
      <section id="priorities" className="py-10 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-white text-high-contrast mb-4 font-sans">
              {t.priorities.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg">
              {t.priorities.subtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {priorities.map((priority, index) => (
              <div 
                key={index}
                className="glass-card overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={priority.image}
                    alt={priority.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-white mb-3 font-sans">
                    {priority.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {priority.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-white text-high-contrast mb-4">
              {t.testimonials.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg">
              {t.testimonials.subtitle}
            </p>
          </div>

          {/* Testimonial Slider */}
          <div className="relative">
            <div className="glass-panel p-5 sm:p-10 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20">
                    <Image
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <p className="text-white/90 text-base sm:text-xl italic mb-4 sm:mb-6 leading-relaxed">
                    &ldquo;{testimonials[currentTestimonial].text}&rdquo;
                  </p>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {testimonials[currentTestimonial].name}
                    </p>
                    <p className="text-white/60 text-sm">
                      {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="glass-button p-3 rounded-full"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentTestimonial
                        ? 'bg-white w-8'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="glass-button p-3 rounded-full"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="hero-glass p-5 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white text-high-contrast mb-4">
              {t.cta.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
              {t.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/about"
                className="glass-button px-8 py-4 text-lg font-semibold inline-block"
              >
                {t.cta.learnMore}
              </Link>
              <a
                href="/contact"
                className="px-8 py-4 text-lg font-semibold border border-white/30 rounded-2xl text-white hover:bg-white/10 transition inline-block text-center"
              >
                {t.cta.contactSales}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 transition-transform duration-300 group"
          title="Chat on WhatsApp"
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>

        <Link
          href="/chat"
          className="w-14 h-14 bg-gradient-to-br from-[#9DC400] to-[#7A9A00] rounded-full flex items-center justify-center shadow-lg shadow-[#9DC400]/30 hover:scale-110 transition-transform duration-300 group"
          title="Live Chat"
        >
          <svg className="w-7 h-7 text-[#001f3f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Link>
      </div>

      {/* Footer */}
      <footer id="contact" className="glass-footer py-8 sm:py-12 px-4 sm:px-6 lg:px-8 mt-10 sm:mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-lg shadow-[#9DC400]/30">
                  <Image
                    src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                    alt="Skyship Logistics Logo"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <span className="text-xl font-bold text-white">Skyship Logistics</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                {t.footer.companyDesc}
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/60 hover:text-white text-sm transition">{t.footer.about}</Link></li>
                <li><a href="#services" className="text-white/60 hover:text-white text-sm transition">{t.footer.services}</a></li>
                <li><a href="#track" className="text-white/60 hover:text-white text-sm transition">{t.footer.trackParcel}</a></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-sm transition">{t.footer.getQuote}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.support}</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/60 hover:text-white text-sm transition">{t.footer.helpCenter}</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-sm transition">{t.footer.contactUs}</Link></li>
                <li><Link href="/faqs" className="text-white/60 hover:text-white text-sm transition">{t.footer.faqs}</Link></li>
                <li><Link href="/chat" className="text-white/60 hover:text-white text-sm transition">{t.footer.liveChat}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-white/60 hover:text-white text-sm transition">{t.footer.terms}</Link></li>
                <li><Link href="/privacy" className="text-white/60 hover:text-white text-sm transition">{t.footer.privacy}</Link></li>
                <li><Link href="/cookies" className="text-white/60 hover:text-white text-sm transition">{t.footer.cookies}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.staff}</h4>
              <ul className="space-y-2">
                <li><Link href="/staff" className="text-white/60 hover:text-white text-sm transition">{t.footer.staffPortal}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              {t.footer.rights}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
