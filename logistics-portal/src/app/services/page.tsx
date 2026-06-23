'use client'

import Link from 'next/link'
import Image from 'next/image'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const services = [
  {
    id: 'air',
    title: 'Air Freight',
    shortDesc: 'Speed Without Compromise',
    description: 'When time is your most valuable asset, Skyship Logistics\'s Air Freight solutions deliver. We leverage a global network of premium air carriers to ensure your high-priority cargo reaches any destination worldwide in record time.',
    features: ['Express delivery to 200+ countries', 'Real-time flight tracking', 'Temperature-controlled cargo options', 'Priority handling for urgent shipments', 'Customs clearance assistance'],
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-2 .5-3.5 2L12 9l-6.8-1.8c-.5-.1-1 .1-1.3.5-.3.4-.2 1 .1 1.3l2.9 2.9L5 14H2l-1 3 3-1v-2l3.2.9 2.9 2.9c.3.3.9.4 1.3.1.4-.3.6-.8.5-1.3z"/>
      </svg>
    ),
    color: 'from-sky-500/20 to-blue-600/20',
    border: 'border-sky-400/30',
  },
  {
    id: 'ocean',
    title: 'Ocean Freight',
    shortDesc: 'Global Reach, Scalable Solutions',
    description: 'For large-scale international trade, our Ocean Freight service offers the perfect balance of cost-efficiency and reliability. Whether FCL or LCL, Skyship provides secure transit across all major sea lanes with real-time maritime tracking.',
    features: ['FCL and LCL shipping options', 'Container tracking across all major ports', 'Competitive rates for bulk cargo', 'Hazardous materials handling', 'Port-to-port and door-to-door service'],
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    color: 'from-cyan-500/20 to-teal-600/20',
    border: 'border-cyan-400/30',
  },
  {
    id: 'warehouse',
    title: 'Warehousing',
    shortDesc: 'Smart Storage & Inventory Control',
    description: 'Our state-of-the-art warehousing facilities are strategic hubs for your supply chain. Featuring climate-controlled environments and advanced Inventory Management Systems, we ensure your goods are protected and ready for rapid distribution.',
    features: ['Climate-controlled storage facilities', '24/7 security monitoring', 'Advanced inventory management systems', 'Pick and pack services', 'Cross-docking capabilities'],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    color: 'from-violet-500/20 to-purple-600/20',
    border: 'border-violet-400/30',
  },
  {
    id: 'road',
    title: 'Road Freight',
    shortDesc: 'Last-Mile Precision',
    description: 'The final link in the chain is often the most critical. Our Road Freight network provides door-to-door delivery with a fleet of modern, GPS-tracked vehicles, ensuring total transparency and safety on every last-mile route.',
    features: ['Door-to-door delivery service', 'GPS-tracked fleet', 'Express and standard delivery options', 'Cross-border trucking expertise', 'Real-time delivery notifications'],
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    color: 'from-lime-500/20 to-green-600/20',
    border: 'border-lime-400/30',
  },
]

export default function ServicesPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav active="/services" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">What We Offer</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Our <span className="text-[#9DC400]">Services</span>
          </h1>
          <div className="w-20 h-1 bg-linear-to-r from-[#9DC400] to-[#7A9A00] mx-auto rounded-full mb-6" />
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Comprehensive logistics solutions tailored to your business needs — from express air freight to last-mile delivery.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-10">
          {services.map((service, index) => (
            <div key={service.id} className="glass-card overflow-hidden">
              <div className={`grid md:grid-cols-2 gap-0 ${index % 2 !== 0 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                {/* Image */}
                <div className="relative h-64 md:h-auto min-h-[320px]">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${service.color} border ${service.border} backdrop-blur-sm mb-3`}>
                      <span className="text-white">{service.icon}</span>
                      <span className="text-white text-xs font-semibold uppercase tracking-wider">{service.shortDesc}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">{service.title}</h2>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center bg-white/5">
                  <p className="text-white/85 text-base leading-relaxed mb-8">{service.description}</p>

                  <p className="text-[#9DC400] text-xs font-semibold uppercase tracking-widest mb-4">Key Features</p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-white/75 text-sm">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#9DC400]/15 border border-[#9DC400]/40 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-[#9DC400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/contact" className="skyship-button px-8 py-3 inline-block text-center self-start font-bold">
                    Get a Quote
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="hero-glass p-10 sm:p-14 text-center">
            <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-widest mb-3">Tailored Logistics</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Need a Custom Solution?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Our logistics experts can design a fully tailored solution for your unique business requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="skyship-button px-8 py-4 text-lg font-bold inline-block">Contact Our Team</Link>
              <Link href="/" className="glass-button px-8 py-4 text-lg font-semibold inline-block">Back to Home</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
