'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TrackingResult } from '@/components/TrackingResult'
import { TrackingSearch } from '@/components/TrackingSearch'
import { TrackingStateView } from '@/components/TrackingStateView'
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

          <div className="logistics-muted mt-4 text-xs">
            <p>Need help? <Link href="/contact" className="text-[#9DC400] underline hover:text-[#d7ef7b]">Contact us</Link></p>
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
