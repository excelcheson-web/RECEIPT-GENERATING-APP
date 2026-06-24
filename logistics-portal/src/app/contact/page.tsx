'use client'

import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import ContactForm from '@/components/ContactForm'
import { SKYSHIP_CONFIG } from '@/lib/constants'

export default function ContactPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav active="/contact" />

      {/* Hero */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">Get In Touch</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Contact <span className="text-[#9DC400]">Us</span>
        </h1>
        <div className="w-20 h-1 bg-[#9DC400] mx-auto rounded-full mb-4" />
        <p className="text-white/65 text-lg max-w-xl mx-auto">
          Send us a message and we will get back to you within 2 business hours.
        </p>
      </section>

      {/* Two-column layout */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8">

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-white mb-2">Send a Message</h2>
              <p className="text-white/55 text-sm mb-8">Fill in the form and our team will contact you shortly.</p>
              <ContactForm />
            </div>
          </div>

          {/* Info cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#9DC400]/10 border border-[#9DC400]/25 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[#9DC400] font-semibold uppercase tracking-widest mb-1">Visit Us</p>
                  <p className="text-white font-medium text-sm leading-snug">{SKYSHIP_CONFIG.address}</p>
                  <p className="text-white/50 text-xs mt-0.5">London, United Kingdom</p>
                </div>
              </div>
            </div>

            {/* Live chat CTA */}
            <div className="glass-panel p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#9DC400] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#001f3f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Need Instant Help?</h3>
              <p className="text-white/55 text-sm mb-4">Chat with our AI assistant right now.</p>
              <Link href="/chat" className="skyship-button px-6 py-2.5 text-sm font-bold inline-block">
                Start Live Chat
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
