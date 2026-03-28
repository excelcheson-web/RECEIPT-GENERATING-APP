'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setShowSuccess(true)
    
    setTimeout(() => {
      setShowSuccess(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    }, 3000)
  }

  return (
    <div className="min-h-screen mesh-gradient py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-[#9DC400]/30">
              <img
                src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
                alt="Skyship Logistics Logo"
                className="w-full h-full object-cover"
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

          {showSuccess ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#9DC400]/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#9DC400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
              <p className="text-white/70">
                Thank you for contacting us. We will reply to your email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="glass-input w-full glass-input-lime"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="glass-input w-full glass-input-lime"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="glass-input w-full glass-input-lime"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                    className="glass-input w-full glass-input-lime"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Please describe your inquiry in detail..."
                  className="glass-input w-full glass-input-lime resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="skyship-button w-full px-8 py-4 text-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Message to Email'}
              </button>
            </form>
          )}

          {/* Contact Info */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-white/90 font-medium">Email</p>
                <p className="text-white/70 text-sm">support@skyship.com</p>
              </div>
              <div>
                <p className="text-white/90 font-medium">Phone</p>
                <p className="text-white/70 text-sm">+1 (800) 555-SHIP</p>
              </div>
              <a href="https://wa.me/18005557447" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition">
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
