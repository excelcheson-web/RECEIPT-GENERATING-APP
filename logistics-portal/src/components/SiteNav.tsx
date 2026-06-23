'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface SiteNavProps {
  active?: string
}

export default function SiteNav({ active }: SiteNavProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/about', label: t.nav.about },
    { href: '/services', label: t.nav.services },
    { href: '/track', label: t.nav.track },
    { href: '/contact', label: t.nav.contact },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav-10px">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-lg shadow-[#9DC400]/30 flex-shrink-0">
            <Image
              src="/Gemini_Generated_Image_fdrkvsfdrkvsfdrk.png"
              alt="Skyship Logistics"
              fill
              sizes="56px"
              className="object-cover"
              priority
            />
          </div>
          <span className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
            Skyship Logistics
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link text-sm ${active === href ? 'bg-white/15 text-[#9DC400] border-[#9DC400]/30' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <button
            className="md:hidden glass-button p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden glass-panel mx-3 mt-2 p-4 rounded-xl relative z-50">
            <nav className="flex flex-col gap-2">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="nav-link text-sm py-2"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-white/20 pt-2 mt-2">
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
