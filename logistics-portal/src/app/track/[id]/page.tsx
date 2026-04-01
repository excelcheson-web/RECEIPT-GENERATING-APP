'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrackingResult } from '@/components/TrackingResult'
import { TrackingStateView } from '@/components/TrackingStateView'
import { getWaybillByNumber } from '@/services/waybillService'
import type { StoredWaybill } from '@/lib/types'
import { COMPANY_CONTACT } from '@/lib/constants'

const TRACKING_DELAY_MS = 6000

export default function TrackResultPage() {
  const router = useRouter()
  const params = useParams()
  const rawId = params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId || ''

  const [query, setQuery] = useState(id)
  const [waybill, setWaybill] = useState<StoredWaybill | null>(null)
  const [state, setState] = useState<'empty' | 'loading' | 'notfound' | 'success'>(id ? 'loading' : 'empty')
  const whatsappHref = `https://wa.me/${COMPANY_CONTACT.phone.replace(/\D/g, '')}`

  useEffect(() => {
    setQuery(id)
  }, [id])

  useEffect(() => {
    async function fetchWaybill() {
      if (!id) {
        setState('empty')
        setWaybill(null)
        return
      }

      setState('loading')
      try {
        const [data] = await Promise.all([
          getWaybillByNumber(id),
          new Promise((resolve) => setTimeout(resolve, TRACKING_DELAY_MS)),
        ])
        if (data) {
          setWaybill(data)
          setState('success')
        } else {
          setWaybill(null)
          setState('notfound')
        }
      } catch {
        setWaybill(null)
        setState('notfound')
      }
    }

    fetchWaybill()
  }, [id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const value = query.trim()
    if (value) {
      router.push(`/track/${value}`)
    }
  }

  return (
    <div className="min-h-screen mesh-gradient py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Track Shipment</h1>
          <Link href="/track" className="px-4 py-2 text-sm rounded-lg border border-[#3d587f] bg-[#122b49] text-[#cfe0f5] hover:bg-[#18385e] transition">
            Back
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter tracking number"
            className="flex-1 px-4 py-3 rounded-xl border border-[#3d587f] bg-[#102744] text-white placeholder-[#90abc7] focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
          />
          <button type="submit" className="px-6 py-3 font-semibold rounded-xl bg-lime-500 text-[#0b1b33] hover:bg-lime-400 transition shadow-lg shadow-lime-900/30">
            Track
          </button>
        </form>

        <div className="mb-8 rounded-xl border border-[#3d587f] bg-[#102744]/90 px-4 py-3 text-sm text-[#d6e3f4]">
          <span className="font-semibold text-lime-300">WhatsApp Support:</span>{' '}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-lime-300 transition"
          >
            {COMPANY_CONTACT.phone}
          </a>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl border border-[#3d587f] bg-[#0d223c] shadow-2xl shadow-black/35">
          <TrackingStateView state={state} notFoundMessage="Tracking number not found. Please check and try again.">
            {waybill && <TrackingResult waybill={waybill} layout="horizontal" />}
          </TrackingStateView>
        </div>
      </div>
    </div>
  )
}
