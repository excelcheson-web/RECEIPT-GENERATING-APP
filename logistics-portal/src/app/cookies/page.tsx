import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

const cookieTypes = [
  {
    name: 'Essential',
    badge: 'Always Active',
    desc: 'Required for the website to function — maintaining sessions, enabling tracking lookups, and securing your account.',
    duration: 'Session',
  },
  {
    name: 'Analytics',
    badge: 'Optional',
    desc: 'Help us understand how visitors interact with our website by collecting anonymous usage data so we can improve.',
    duration: 'Up to 2 years',
  },
  {
    name: 'Preference',
    badge: 'Optional',
    desc: 'Remember your settings such as language selection and display preferences for a more personalised experience.',
    duration: 'Up to 1 year',
  },
  {
    name: 'Security',
    badge: 'Always Active',
    desc: 'Protect your account and our services from fraud and unauthorised access.',
    duration: 'Up to 30 days',
  },
]

const sections = [
  {
    num: '01',
    title: 'What Are Cookies',
    content: 'Cookies are small text files placed on your device when you visit a website. They are widely used to make sites work efficiently and to provide information to website owners.',
  },
  {
    num: '03',
    title: 'Cookie Duration',
    list: [
      'Session cookies — expire when you close your browser',
      'Preference cookies — last up to 1 year',
      'Analytics cookies — last up to 2 years',
      'Security cookies — last up to 30 days',
    ],
  },
  {
    num: '04',
    title: 'Managing Cookies',
    intro: 'You can control cookies in several ways:',
    list: [
      'Browser settings — most browsers allow you to refuse or delete cookies',
      'Cookie banner — adjust preferences when you first visit',
      'Browser extensions — third-party tools to manage cookie behaviour',
    ],
    footer: 'Disabling certain cookies may affect website functionality, particularly the shipment tracking features.',
  },
  {
    num: '05',
    title: 'Updates to This Policy',
    content: 'We may update this Cookie Policy to reflect changes in technology, regulations, or business practices. Please check this page periodically.',
  },
  {
    num: '06',
    title: 'Contact Us',
    content: 'Questions about our Cookie Policy? Email privacy@skyshiplogistics.com or call +447352998900.',
  },
]

export default function CookiesPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="pt-20 sm:pt-32 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-4">Legal</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Cookie <span className="text-[#9DC400]">Policy</span>
        </h1>
        <div className="w-20 h-1 bg-[#9DC400] mx-auto rounded-full mb-4" />
        <p className="text-white/55 text-sm">Last updated: January 2026</p>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Cookie types grid */}
          <div className="glass-panel p-8 sm:p-10">
            <div className="flex gap-5 sm:gap-8 mb-8">
              <div className="text-2xl font-bold text-[#9DC400]/40 shrink-0 w-10 pt-0.5 font-mono">02</div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">How We Use Cookies</h2>
                <p className="text-white/55 text-sm">Skyship Logistics uses four categories of cookies.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {cookieTypes.map((c) => (
                <div key={c.name} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-[#9DC400]/25 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">{c.name}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      c.badge === 'Always Active'
                        ? 'bg-[#9DC400]/15 text-[#9DC400] border border-[#9DC400]/30'
                        : 'bg-white/10 text-white/60 border border-white/15'
                    }`}>
                      {c.badge}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed mb-3">{c.desc}</p>
                  <p className="text-white/40 text-xs">Duration: {c.duration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining sections */}
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
                <Link href="/privacy" className="text-white/50 hover:text-[#9DC400] transition">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
