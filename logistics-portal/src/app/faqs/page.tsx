'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const faqs = [
  {
    question: 'How do I track my shipment?',
    answer: 'Enter your tracking number (e.g. SK-1234-5678) on our homepage and click Track. You will see real-time updates on your shipment\'s location, current status, and estimated delivery time — including a live map view.',
  },
  {
    question: 'What shipping services do you offer?',
    answer: 'We offer comprehensive logistics solutions: Air Freight for time-sensitive deliveries, Ocean Freight (FCL & LCL) for cost-effective large shipments, Road Freight for last-mile and cross-border transport, and climate-controlled Warehousing with advanced inventory management.',
  },
  {
    question: 'How long does shipping take?',
    answer: 'Air Freight: 1–3 business days. Ocean Freight: 10–30 days depending on route. Road Freight: same-day to 5 business days based on distance. Precise estimates are provided at booking.',
  },
  {
    question: 'What are your shipping rates?',
    answer: 'Rates depend on weight, dimensions, destination, and service type. We offer competitive, transparent pricing with no hidden fees. Contact our sales team for a custom quote.',
  },
  {
    question: 'Do you offer international shipping?',
    answer: 'Yes — we ship to over 200 countries and territories. We handle all customs documentation and clearance to ensure smooth international delivery.',
  },
  {
    question: 'What items can I ship?',
    answer: 'We handle most commercial goods, documents, and personal items. Prohibited items include hazardous materials, illegal goods, and destination-restricted items. Contact us if you are unsure about a specific item.',
  },
  {
    question: 'How do I prepare my shipment?',
    answer: 'Use sturdy boxes, cushion items with bubble wrap or foam, and seal securely. Clearly label the package with full recipient details. For fragile items, mark as FRAGILE and use additional padding.',
  },
  {
    question: 'What happens if my shipment is delayed?',
    answer: 'Real-time tracking keeps you informed throughout. We send proactive delay notifications and our 24/7 support team will work to resolve any significant delays as a priority.',
  },
  {
    question: 'Do you provide insurance for shipments?',
    answer: 'Yes. Basic coverage is included with every shipment. Additional insurance is available for high-value items, and claims can be filed directly through our customer support portal.',
  },
  {
    question: 'How can I contact customer support?',
    answer: 'Our team is available 24/7 via Live Chat on our website. You can also visit our Contact page to send us a message and we will get back to you within 2 business hours.',
  },
]

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">Help Centre</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Frequently Asked <span className="text-[#9DC400]">Questions</span>
        </h1>
        <div className="w-20 h-1 bg-[#9DC400] mx-auto rounded-full mb-4" />
        <p className="text-white/65 text-lg max-w-xl mx-auto">
          Answers to the most common questions about our logistics services.
        </p>
      </section>

      {/* FAQ accordion */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={`glass-card overflow-hidden transition-all ${isOpen ? 'border-[#9DC400]/40' : ''}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-[#9DC400] font-bold text-sm shrink-0 w-6 text-right">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white font-semibold text-base leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#9DC400] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pl-14 sm:pl-16">
                    <p className="text-white/75 leading-relaxed text-sm">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="hero-glass p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#9DC400]/15 border border-[#9DC400]/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#9DC400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Still Have Questions?</h2>
            <p className="text-white/65 text-sm mb-6">Our support team is available 24/7 to help you.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="skyship-button px-7 py-3 font-bold inline-block">
                Contact Support
              </Link>
              <Link href="/chat" className="glass-button px-7 py-3 font-semibold inline-block">
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
