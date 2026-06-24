import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const sections = [
  {
    num: '01',
    title: 'Acceptance of Terms',
    content: 'By accessing and using Skyship Logistics services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.',
  },
  {
    num: '02',
    title: 'Service Description',
    content: 'Skyship Logistics provides global logistics and supply chain solutions including air freight, ocean freight, warehousing, and road transportation. We act as a facilitator between shippers and carriers to ensure efficient delivery of goods.',
  },
  {
    num: '03',
    title: 'User Responsibilities',
    list: [
      'Provide accurate and complete information for shipping',
      'Ensure all shipments comply with applicable laws and regulations',
      'Properly package and label all items for transport',
      'Pay all fees and charges as agreed upon',
    ],
  },
  {
    num: '04',
    title: 'Liability Limitations',
    content: "Skyship Logistics liability is limited to the declared value of the shipment or the actual loss, whichever is less. We are not liable for delays caused by circumstances beyond our control including weather, customs, or carrier issues.",
  },
  {
    num: '05',
    title: 'Tracking and Updates',
    content: 'We provide real-time tracking services. However, tracking information is dependent on carrier updates and may not always reflect real-time status. We strive to provide accurate information but cannot guarantee 100% accuracy.',
  },
  {
    num: '06',
    title: 'Modifications',
    content: 'Skyship Logistics reserves the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.',
  },
  {
    num: '07',
    title: 'Contact Information',
    content: 'For questions about these Terms & Conditions, please contact us at: legal@skyshiplogistics.com or by phone at +447352998900.',
  },
]

export default function TermsPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">Legal</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Terms <span className="text-[#9DC400]">&amp; Conditions</span>
        </h1>
        <div className="w-20 h-1 bg-[#9DC400] mx-auto rounded-full mb-4" />
        <p className="text-white/55 text-sm">Last updated: January 2026</p>
      </section>

      {/* Document body */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel p-8 sm:p-12">
            <div className="space-y-10">
              {sections.map((s) => (
                <div key={s.num} className="flex gap-5 sm:gap-8">
                  <div className="text-2xl font-bold text-[#9DC400]/40 shrink-0 w-10 pt-0.5 font-mono">
                    {s.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white mb-3">{s.title}</h2>
                    {s.content && (
                      <p className="text-white/70 leading-relaxed text-sm">{s.content}</p>
                    )}
                    {s.list && (
                      <ul className="space-y-2">
                        {s.list.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#9DC400] shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between gap-4">
              <p className="text-white/40 text-xs">© 2026 Skyship Logistics. All rights reserved.</p>
              <div className="flex gap-4 text-xs">
                <Link href="/privacy" className="text-white/50 hover:text-[#9DC400] transition">Privacy Policy</Link>
                <Link href="/cookies" className="text-white/50 hover:text-[#9DC400] transition">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
