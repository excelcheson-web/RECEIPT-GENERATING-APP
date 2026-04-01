'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Waybill {
  waybillNumber: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  origin: string;
  destination: string;
  shipmentMode: string;
  serviceType: string;
  parcelDescription: string;
  quantity: number;
  weight: number;
  dimensions: string;
  currentStatus: string;
  currentLocation: string;
  bookingDate: string;
  estimatedDeliveryDate: string;
  deliveredDate?: string;
  paymentStatus: string;
  specialInstructions?: string;
  trackingEvents: {
    status: string;
    location: string;
    description: string;
    eventTime: string;
  }[];
}

export default function TrackPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { t } = useTranslation()
  
  const [waybill, setWaybill] = useState<Waybill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchWaybillData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/track/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Tracking number not found. Please check your tracking ID and try again.')
        } else {
          setError('Failed to fetch tracking information. Please try again later.')
        }
        return
      }
      
      const data = await response.json()
      setWaybill(data)
    } catch (err) {
      setError('An error occurred while fetching tracking data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchWaybillData()
    }
  }, [id])

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber.trim()}`)
    }
  }

  const handleRefresh = () => {
    fetchWaybillData()
  }

  if (loading) {
    return (
      <div className="mesh-gradient min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <div className="w-16 h-16 border-4 border-[#C8FF00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mesh-gradient min-h-screen">
        <header className="glass-header fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image
                  src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                  alt="Skyship Logistics Logo"
                  fill
                  className="object-cover"
                  sizes="40px"
                  priority
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white text-high-contrast">
                Skyship Logistics
              </span>
            </Link>
          </div>
        </header>
        <main className="pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="hero-glass p-8 sm:p-12 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Tracking Not Found</h1>
              <p className="text-white/70 mb-6">{error}</p>
              <form onSubmit={handleTrack} className="max-w-md mx-auto">
                <label className="block text-white/80 text-sm mb-3 font-medium">
                  Try another tracking number
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g., SK-1234-5678"
                    className="glass-input flex-1 text-base"
                  />
                  <button
                    type="submit"
                    className="skyship-button px-6 py-3 whitespace-nowrap font-bold"
                  >
                    Track
                  </button>
                </div>
              </form>
              <div className="mt-8">
                <Link href="/" className="glass-button px-6 py-3 inline-block">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!waybill) {
    return null
  }

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'IN_TRANSIT':
        return 'bg-blue-500';
      case 'DELIVERED':
        return 'bg-green-500';
      case 'DELAYED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 mesh-gradient" />
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav-10px">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 lg:px-8">
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
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="nav-link text-sm">{t.nav.home}</Link>
            <Link href="/about" className="nav-link text-sm">{t.nav.about}</Link>
            <Link href="/services" className="nav-link text-sm">{t.nav.services}</Link>
            <Link href="/track" className="nav-link text-sm text-[#9DC400]">{t.nav.track}</Link>
            <Link href="/contact" className="nav-link text-sm">{t.nav.contact}</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
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
      <main className="relative pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-high-contrast mb-4">
              Track Your Shipment
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              Real-time updates for your waybill: <span className="font-bold text-[#9DC400]">{waybill.waybillNumber}</span>
            </p>
          </div>

          <div className={`glass-panel p-6 sm:p-8 mb-8`}>
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full mr-2 ${getStatusColor(waybill.currentStatus)}`}></div>
              <h2 className="text-2xl font-bold text-white">{waybill.currentStatus}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-white/70">Waybill Number</p>
                <p className="text-white font-bold">{waybill.waybillNumber}</p>
              </div>
              <div>
                <p className="text-white/70">Service Type</p>
                <p className="text-white font-bold">{waybill.serviceType}</p>
              </div>
              <div>
                <p className="text-white/70">Booking Date</p>
                <p className="text-white font-bold">{new Date(waybill.bookingDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-white/70">Origin</p>
                <p className="text-white font-bold">{waybill.origin}</p>
              </div>
              <div>
                <p className="text-white/70">Destination</p>
                <p className="text-white font-bold">{waybill.destination}</p>
              </div>
              <div>
                <p className="text-white/70">Estimated Delivery</p>
                <p className="text-white font-bold">{new Date(waybill.estimatedDeliveryDate).toLocaleDateString()}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-white/70">Parcel Description</p>
                <p className="text-white font-bold">{waybill.parcelDescription}</p>
              </div>
              <div>
                <p className="text-white/70">Quantity / Pieces</p>
                <p className="text-white font-bold">{waybill.quantity}</p>
              </div>
              <div>
                <p className="text-white/70">Weight</p>
                <p className="text-white font-bold">{waybill.weight} kg</p>
              </div>
              <div>
                <p className="text-white/70">Current Location</p>
                <p className="text-white font-bold">{waybill.currentLocation}</p>
              </div>
              <div>
                <p className="text-white/70">Last Updated</p>
                <p className="text-white font-bold">{new Date(waybill.trackingEvents[0]?.eventTime).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Sender & Receiver</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-white/70">Sender</p>
                <p className="text-white font-bold">{waybill.senderName}</p>
                <p className="text-white">{waybill.senderAddress}</p>
              </div>
              <div>
                <p className="text-white/70">Receiver</p>
                <p className="text-white font-bold">{waybill.receiverName}</p>
                <p className="text-white">{waybill.receiverAddress}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Tracking Timeline</h2>
            <ul>
              {waybill.trackingEvents.map((event, index) => (
                <li key={index} className="border-l-2 border-[#9DC400] pl-4 pb-4">
                  <div className={`w-4 h-4 rounded-full absolute -left-2 mt-1 ${index === 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <p className="text-white font-bold">{event.status}</p>
                  <p className="text-white/70">{new Date(event.eventTime).toLocaleString()}</p>
                  <p className="text-white/70">{event.location}</p>
                  <p className="text-white/70">{event.description}</p>
                </li>
              ))}
            </ul>
            {waybill.trackingEvents.length === 0 && (
              <p className="text-white/70">No tracking events yet.</p>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={handleRefresh}
              className="skyship-button px-8 py-3 whitespace-nowrap font-bold w-full"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
