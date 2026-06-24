import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const sections = [
  {
    num: '01',
    title: 'Information We Collect',
    intro: 'Skyship Logistics collects information necessary to provide our logistics services:',
    list: [
      'Contact information (name, email, phone, address)',
      'Shipment details and tracking numbers',
      'Payment and billing information',
      'Business information for corporate accounts',
      'Usage data and analytics',
    ],
  },
  {
    num: '02',
    title: 'How We Use Your Information',
    intro: 'We use your information to:',
    list: [
      'Process and track your shipments',
      'Communicate shipping updates and notifications',
      'Provide customer support',
      'Improve our services and user experience',
      'Comply with legal and regulatory requirements',
    ],
  },
  {
    num: '03',
    title: 'Data Security',
    content: 'We implement industry-standard security measures including encryption, secure servers, and access controls. Your tracking information is protected and only accessible to authorised personnel and yourself.',
  },
  {
    num: '04',
    title: 'Data Sharing',
    intro: 'We only share your information with:',
    list: [
      'Shipping carriers and logistics partners (necessary for delivery)',
      'Service providers who assist our operations',
      'Legal authorities when required by law',
    ],
    footer: 'We do not sell your personal information to third parties.',
  },
  {
    num: '05',
    title: 'Cookies and Tracking',
    content: 'We use cookies and similar technologies to enhance your experience, remember your preferences, and analyse website traffic. You can control cookie settings through your browser or via our Cookie Policy page.',
  },
  {
    num: '06',
    title: 'Your Rights',
    intro: 'You have the right to:',
    list: [
      'Access your personal information',
      'Request correction of inaccurate data',
      'Request deletion of your data',
      'Opt-out of marketing communications',
      'Export your data in a portable format',
    ],
  },
  {
    num: '07',
    title: 'Contact Our DPO',
    content: 'For privacy-related questions or requests, contact our Data Protection Officer at privacy@skyshiplogistics.com, by phone at +447352998900, or by post to: GOLDEN CROSS HOUSE, 456-458 STRAND, London.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">Legal</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Privacy <span className="text-[#9DC400]">Policy</span>
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
                    {s.intro && <p className="text-white/70 text-sm mb-3">{s.intro}</p>}
                    {s.content && <p className="text-white/70 leading-relaxed text-sm">{s.content}</p>}
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
                    {s.footer && <p className="text-white/70 text-sm mt-4">{s.footer}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between gap-4">
              <p className="text-white/40 text-xs">© 2026 Skyship Logistics. All rights reserved.</p>
              <div className="flex gap-4 text-xs">
                <Link href="/terms" className="text-white/50 hover:text-[#9DC400] transition">Terms &amp; Conditions</Link>
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
