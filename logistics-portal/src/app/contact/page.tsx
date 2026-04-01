'use client'

import Link from 'next/link'
import Image from 'next/image'
import ContactForm from '@/components/ContactForm'
import { COMPANY_CONTACT } from '@/lib/constants'

export default function ContactPage() {
  const whatsappHref = `https://wa.me/${COMPANY_CONTACT.phone.replace(/\D/g, '')}`

  return (
    <div className="min-h-screen mesh-gradient py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-[#9DC400]/30">
              <Image
                src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                alt="Skyship Logistics Logo"
                fill
                className="object-cover"
                sizes="64px"
                priority
              />
            </div>
            <span className="text-xl font-bold text-white">Skyship Logistics</span>
          </Link>
          <Link href="/" className="glass-button px-4 py-2 text-sm">
            Back to Home
          </Link>
        </div>

        {/* Contact Form */}
        <div className="glass-panel p-8 sm:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Contact Us
            </h1>
            <p className="text-white/70 text-lg">
              Send us a message and we will reply to your email
            </p>
          </div>

          <ContactForm />

          {/* Contact Info */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-white/90 font-medium">Email</p>
                <p className="text-white/70 text-sm">contact@skydexlogistics.com</p>
              </div>
              <div>
                <p className="text-white/90 font-medium">Phone</p>
                <p className="text-white/70 text-sm">+447352998900</p>
              </div>
              <div>
                <p className="text-white/90 font-medium">Address</p>
                <p className="text-white/70 text-sm">GOLDEN CROSS HOUSE, 456-458 STRAND</p>
              </div>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition">
                <p className="text-white/90 font-medium">WhatsApp</p>
                <p className="text-white/70 text-sm">Chat with us</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
