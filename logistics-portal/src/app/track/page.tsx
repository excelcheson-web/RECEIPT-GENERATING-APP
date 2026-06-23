'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TrackingResult } from '@/components/TrackingResult'
import { TrackingSearch } from '@/components/TrackingSearch'
import { TrackingStateView } from '@/components/TrackingStateView'
import { COMPANY_CONTACT } from '@/lib/constants'
import type { StoredWaybill } from '@/lib/types'
import { getWaybillByNumber, getWaybillErrorMessage, normalizeWaybillLookupInput } from '@/services/waybillService'

const LOADING_DELAY_MS = 700

type TrackingViewState = 'empty' | 'loading' | 'notfound' | 'error' | 'success'

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function TrackPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = normalizeWaybillLookupInput(searchParams.get('query') || '')
  const [state, setState] = useState<TrackingViewState>('empty')
  const [result, setResult] = useState<StoredWaybill | null>(null)
  const [searchedValue, setSearchedValue] = useState(initialQuery)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const whatsappHref = `https://wa.me/${COMPANY_CONTACT.phone.replace(/\D/g, '')}`

  const handleSearch = useCallback(async (value: string, skipDelay = false) => {
    const normalizedValue = normalizeWaybillLookupInput(value)
    if (!normalizedValue) {
      setSearchedValue('')
      setResult(null)
      setErrorMessage(null)
      setState('empty')
      return
    }

    setSearchedValue(normalizedValue)
    setState('loading')
    setResult(null)
    setErrorMessage(null)

    if (!skipDelay) {
      await wait(LOADING_DELAY_MS)
    }

    try {
      const found = await getWaybillByNumber(normalizedValue)
      if (found) {
        setResult(found)
        setErrorMessage(null)
        setState('success')
        return
      }
      setState('notfound')
    } catch (error) {
      console.error(error)
      setErrorMessage(getWaybillErrorMessage(error, 'tracking lookup'))
      setState('error')
    }
  }, [])

  const handleSearchFromInput = useCallback((value: string) => {
    void handleSearch(value)
  }, [handleSearch])

  const handleRetry = useCallback(() => {
    if (!searchedValue) return
    void handleSearch(searchedValue, true)
  }, [handleSearch, searchedValue])

  useEffect(() => {
    if (state !== 'success' || !searchedValue || !result) return

    let cancelled = false
    const refresh = async () => {
      try {
        const latest = await getWaybillByNumber(searchedValue)
        if (!cancelled && latest) {
          setResult(latest)
        }
      } catch (error) {
        console.error('[track page] refresh failed', error)
      }
    }

    const intervalId = window.setInterval(() => {
      void refresh()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [result, searchedValue, state])

  return (
    <main className="logistics-page-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="logistics-shell max-w-7xl">
        <header className="logistics-hero-panel logistics-fade-in mb-8 p-6 sm:p-8">
          <div className="tracking-hero-grid">
            <div className="space-y-4">
              <div className="live-tracking-indicator">
                <span className="live-dot" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9ef7f]">Live Tracking</span>
              </div>

              <div>
                <h1 className="logistics-title mt-2 text-3xl sm:text-4xl">Track Your Shipment</h1>
                <p className="logistics-subtitle mt-3 max-w-3xl text-sm sm:text-base">
                  Enter your waybill number to view shipment summary, detailed milestones, and sender or consignee information in real time.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="tracking-chip">Global Lane Coverage</span>
                <span className="tracking-chip">Milestone Intelligence</span>
                <span className="tracking-chip">Hold-Aware Updates</span>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 sm:items-end">
              <Link href="/" className="logistics-btn-secondary inline-flex h-10 items-center justify-center px-4 text-sm">
                Back to Home
              </Link>
              <div className="tracking-summary-grid">
                <div className="tracking-stat-card">
                  <p className="tracking-stat-label">Mode</p>
                  <p className="tracking-stat-value">Real-time</p>
                </div>
                <div className="tracking-stat-card">
                  <p className="tracking-stat-label">Data Feed</p>
                  <p className="tracking-stat-value">Operational</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tracking-search-shell mt-6">
            <TrackingSearch
              onSearch={handleSearchFromInput}
              loading={state === 'loading'}
              initialValue={initialQuery}
              autoSubmitOnMount={Boolean(initialQuery)}
            />
          </div>

          <div className="logistics-muted mt-4 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="leading-relaxed">
              Need help?{' '}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                title="Chat on WhatsApp"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#9DC400]/60 bg-[#9DC400]/15 text-[#b8d940] transition hover:bg-[#9DC400]/30 hover:text-[#d7ee73]"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 8.043.003C3.58.003-.048 3.631-.048 8.094c0 1.417.37 2.8 1.073 4.02L0 16l3.993-1.046a8.095 8.095 0 0 0 4.05 1.04h.003c4.463 0 8.091-3.628 8.091-8.091a8.06 8.06 0 0 0-2.536-5.577zM8.047 14.56a6.48 6.48 0 0 1-3.3-.902l-.237-.14-2.37.621.633-2.31-.154-.243a6.48 6.48 0 0 1-.993-3.454c0-3.583 2.916-6.499 6.5-6.499a6.45 6.45 0 0 1 4.6 1.905 6.45 6.45 0 0 1 1.9 4.594c-.002 3.584-2.918 6.5-6.499 6.5zm3.562-4.866c-.195-.098-1.158-.572-1.337-.637-.179-.066-.31-.098-.44.098-.13.195-.505.637-.619.767-.114.13-.228.147-.423.049-.195-.098-.824-.304-1.57-.97-.58-.517-.972-1.156-1.086-1.351-.114-.195-.012-.3.086-.398.087-.086.195-.228.293-.342.098-.114.13-.195.195-.326.065-.13.033-.245-.016-.342-.049-.098-.44-1.06-.603-1.456-.159-.384-.32-.332-.44-.338l-.375-.007a.72.72 0 0 0-.521.245c-.179.195-.684.668-.684 1.628 0 .96.7 1.887.798 2.018.098.13 1.38 2.108 3.345 2.957.467.201.832.321 1.116.411.469.149.896.128 1.234.078.376-.056 1.158-.473 1.321-.93.163-.456.163-.847.114-.93-.049-.082-.179-.13-.374-.228z" />
                </svg>
              </a>
            </p>
          </div>
        </header>

        <TrackingStateView
          state={state}
          errorMessage={errorMessage || undefined}
          onRetry={state === 'error' ? handleRetry : undefined}
          notFoundMessage={`No shipment found for "${searchedValue}". Confirm the number and try again.`}
        >
          {result && (
            <div className="logistics-fade-in">
              <TrackingResult waybill={result} layout="horizontal" />
            </div>
          )}
        </TrackingStateView>
      </div>
    </main>
  )
}

function TrackPageFallback() {
  return (
    <main className="logistics-page-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="logistics-shell max-w-7xl">
        <header className="logistics-hero-panel logistics-fade-in mb-8 p-6 sm:p-8">
          <div className="tracking-hero-grid">
            <div className="space-y-4">
              <div className="live-tracking-indicator">
                <span className="live-dot" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9ef7f]">Live Tracking</span>
              </div>
              <div>
                <h1 className="logistics-title mt-2 text-3xl sm:text-4xl">Track Your Shipment</h1>
                <p className="logistics-subtitle mt-3 max-w-3xl text-sm sm:text-base">
                  Preparing live tracking data...
                </p>
              </div>
            </div>
          </div>
        </header>
      </div>
    </main>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<TrackPageFallback />}>
      <TrackPageContent />
    </Suspense>
  )
}
