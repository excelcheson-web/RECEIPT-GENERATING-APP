'use client'

import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import ContactForm from '@/components/ContactForm'
import { COMPANY_CONTACT } from '@/lib/constants'

const infoCards = [
  {
    label: 'Email Us',
    value: COMPANY_CONTACT.email,
    sub: 'We reply within 2 business hours',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: 'Call Us',
    value: COMPANY_CONTACT.phone,
    sub: 'Available 24/7 for urgent cargo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  {
    label: 'Visit Us',
    value: COMPANY_CONTACT.address,
    sub: 'London, United Kingdom',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#9DC400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
]

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
            {infoCards.map((card, i) => {
              const inner = (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#9DC400]/10 border border-[#9DC400]/25 flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-[#9DC400] font-semibold uppercase tracking-widest mb-1">{card.label}</p>
                    <p className="text-white font-medium text-sm leading-snug">{card.value}</p>
                    <p className="text-white/50 text-xs mt-0.5">{card.sub}</p>
                  </div>
                </div>
              )

              return (
                <div key={i} className="glass-card p-5">
                  {inner}
                </div>
              )
            })}

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
