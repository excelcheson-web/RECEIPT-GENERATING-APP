'use client'

import Link from 'next/link'
import Image from 'next/image'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const priorities = [
  {
    title: 'Customer Centricity',
    description: "We don't just deliver packages; we deliver peace of mind. Every client interaction is guided by empathy and precision.",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M11 3L8 9l4 13 4-13-3-6z"/><path d="M2 9h20"/>
      </svg>
    ),
  },
  {
    title: 'Innovation',
    description: 'We leverage the latest in AI, real-time data and digital tracking to stay ahead of the curve in global logistics.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      </svg>
    ),
  },
  {
    title: 'Sustainability',
    description: 'We constantly optimise our routes and operations to reduce our carbon footprint and build a greener future for global trade.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>
    ),
  },
  {
    title: 'Global Connectivity',
    description: 'Bridging the gap between global markets and local doorsteps with transparent, end-to-end logistics you can track live.',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
]

const reasons = [
  {
    title: 'Precision Tracking',
    desc: 'Our proprietary interface allows you to monitor shipments with minute-by-minute accuracy, anywhere on the globe.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    title: 'Global Reach, Local Expertise',
    desc: 'With a presence in key international hubs, we navigate customs and regional regulations so you don\'t have to.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="5" r="3"/><circle cx="19" cy="8" r="3"/><circle cx="5" cy="8" r="3"/><circle cx="12" cy="19" r="3"/>
        <line x1="12" y1="8" x2="12" y2="16"/><line x1="9" y1="7" x2="6" y2="9"/><line x1="15" y1="7" x2="18" y2="9"/>
      </svg>
    ),
  },
  {
    title: 'Adaptive Solutions',
    desc: 'Whether it\'s a single parcel or massive industrial cargo, our logistics architecture scales to your exact needs.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    title: 'Security First',
    desc: 'Your cargo is protected by industry-leading safety protocols and a dedicated team of logistics professionals.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

export default function AboutPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav active="/about" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">Who We Are</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            About <span className="text-[#9DC400]">Skyship</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-[#9DC400] to-[#7A9A00] mx-auto rounded-full mb-6" />
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            At Skyship, we believe that moving cargo should be as seamless as a clear sky. We provide a glass-box approach to logistics where every movement is visible, every milestone is tracked, and every client is empowered with real-time data.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-8">

        {/* Vision + Who We Are — side by side on desktop */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-8 sm:p-10">
            <div className="identity-icon mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
            <p className="text-white/75 leading-relaxed">
              Transparent Global Connectivity for every client. We aren&apos;t just moving parcels — we are bridging the gap between global markets and local doorsteps with data, trust, and speed.
            </p>
          </div>

          <div className="glass-panel p-8 sm:p-10">
            <div className="identity-icon mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M6 22h12a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M14 2v5a2 2 0 0 0 2 2h5"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Who We Are</h2>
            <p className="text-white/75 leading-relaxed">
              Founded on precision, speed, and integrity, Skyship has grown into a premier international freight partner. From Air and Ocean Freight to Road and Warehousing, we handle the world&apos;s most demanding cargo.
            </p>
          </div>
        </div>

        {/* Why Choose Skyship */}
        <div className="glass-panel p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="identity-icon flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Choose Skyship?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#9DC400]/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#9DC400]/10 border border-[#9DC400]/25 flex items-center justify-center flex-shrink-0">
                  {r.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{r.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prime Priorities */}
        <div>
          <div className="text-center mb-8">
            <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-2">What Drives Us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Our Prime Priorities</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {priorities.map((p, i) => (
              <div key={i} className="company-identity-card flex flex-col items-center text-center group">
                <div className="identity-icon mb-4 group-hover:scale-110 transition-transform">
                  {p.svg}
                </div>
                <h3 className="identity-heading text-lg mb-2">{p.title}</h3>
                <p className="identity-text text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="glass-panel p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: '200+', label: 'Countries Served' },
              { value: '99.7%', label: 'On-Time Rate' },
              { value: '24/7', label: 'Live Support' },
              { value: '10M+', label: 'Shipments Delivered' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-bold text-[#9DC400]">{stat.value}</p>
                <p className="text-white/60 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="hero-glass p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Ship with Confidence?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">Contact our team today and get a tailored logistics solution for your business.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="skyship-button px-8 py-3 inline-block font-bold">Get a Quote</Link>
            <Link href="/track" className="glass-button px-8 py-3 inline-block">Track a Shipment</Link>
          </div>
        </div>

        {/* Logo strip */}
        <div className="flex justify-center pb-4">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-xl shadow-[#9DC400]/20 border border-[#9DC400]/20">
            <Image src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png" alt="Skyship Logo" fill sizes="96px" className="object-cover" />
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
