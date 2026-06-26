'use client'

import { useState } from 'react'
import type { StoredWaybill, TrackingEventRecord } from '@/lib/types'
import { normalizeTrackingEvents } from '@/lib/trackingAutomation'
import {
  getWaybillByNumber,
  getWaybillErrorMessage,
  normalizeWaybillLookupInput,
  updateWaybillTimeline,
} from '@/services/waybillService'
import { useLiveTrackingRuntime } from '@/hooks/useLiveTrackingRuntime'

interface EditableTimelineEvent extends TrackingEventRecord {
  id: string
}

const HOLD_CONDITIONS = [
  'Customs Clearance',
  'Weather Delay',
  'Security Inspection',
  'Port Congestion',
  'Documentation Review',
  'Regulatory Hold',
  'Recipient Unavailable',
  'Address Verification',
  'Payment Pending',
  'Manual Hold',
] as const

function toInputDateTime(value: string): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return ''
  const date = new Date(parsed)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function fromInputDateTime(value: string, fallback: string): string {
  const parsed = Date.parse(value)
  if (!value || Number.isNaN(parsed)) return fallback
  return new Date(parsed).toISOString()
}

function makeEditableEvents(events: TrackingEventRecord[]): EditableTimelineEvent[] {
  return normalizeTrackingEvents(events).map((event, index) => ({
    ...event,
    id: `evt-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  }))
}

function toPersistedEvents(events: EditableTimelineEvent[]): TrackingEventRecord[] {
  return events.map((event) => ({
    status: event.status.trim() || 'Status Update',
    location: event.location.trim() || 'Unknown Location',
    description: event.description.trim() || 'No description provided.',
    eventTime: event.eventTime,
    isHold: Boolean(event.isHold),
    holdCondition: event.isHold && event.holdCondition ? event.holdCondition : undefined,
  }))
}

function stateLabel(index: number, activeIndex: number, isOnHold: boolean): 'Completed' | 'Current' | 'Upcoming' | 'On Hold' {
  if (activeIndex < 0) return 'Upcoming'
  if (index < activeIndex) return 'Completed'
  if (index === activeIndex) return isOnHold ? 'On Hold' : 'Current'
  return 'Upcoming'
}

function stateClasses(label: ReturnType<typeof stateLabel>): string {
  if (label === 'Completed') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
  if (label === 'Current') return 'border-lime-300/50 bg-lime-400/10 text-lime-100'
  if (label === 'On Hold') return 'border-amber-300/60 bg-amber-400/10 text-amber-100'
  return 'border-slate-400/30 bg-[#122a43] text-slate-200'
}

function redistributeToTransitWindow(
  events: EditableTimelineEvent[],
  startIso: string,
  endIso: string,
): EditableTimelineEvent[] {
  const startMs = Date.parse(startIso)
  const endMs = Date.parse(endIso)
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs || events.length < 2) return events

  const sorted = [...events].sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime))
  const firstMs = Date.parse(sorted[0].eventTime)
  const lastMs = Date.parse(sorted[sorted.length - 1].eventTime)
  const sourceDuration = Math.max(lastMs - firstMs, 0)
  const targetDuration = endMs - startMs

  return sorted.map((event, index) => {
    if (index === 0) return { ...event, eventTime: new Date(startMs).toISOString() }
    if (index === sorted.length - 1) return { ...event, eventTime: new Date(endMs).toISOString() }
    const ratio =
      sourceDuration > 0
        ? (Date.parse(event.eventTime) - firstMs) / sourceDuration
        : index / (sorted.length - 1)
    return { ...event, eventTime: new Date(startMs + Math.round(targetDuration * ratio)).toISOString() }
  })
}

export function AdminTimelineControlPanel() {
  const [lookupValue, setLookupValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastLookupAttempt, setLastLookupAttempt] = useState('')
  const [loadedWaybill, setLoadedWaybill] = useState<StoredWaybill | null>(null)
  const [events, setEvents] = useState<EditableTimelineEvent[]>([])
  const [pendingHoldId, setPendingHoldId] = useState<string | null>(null)
  const [pendingCondition, setPendingCondition] = useState<string>(HOLD_CONDITIONS[0])
  const [transitStartDate, setTransitStartDate] = useState('')
  const [transitEndDate, setTransitEndDate] = useState('')
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false)

  const runtime = useLiveTrackingRuntime(events, 5000)
  const hasLoadedWaybill = loadedWaybill !== null

  const loadWaybill = async (rawValue: string) => {
    const query = normalizeWaybillLookupInput(rawValue)
    if (!query) {
      setError('Enter a waybill number to load timeline control.')
      return
    }

    setLastLookupAttempt(query)
    setIsLoading(true)
    setFeedback(null)
    setError(null)

    try {
      const waybill = await getWaybillByNumber(query)
      if (!waybill) {
        setLoadedWaybill(null)
        setEvents([])
        setError(`No waybill found for "${query}".`)
        return
      }

      const sourceEvents =
        Array.isArray(waybill.trackingEvents) && waybill.trackingEvents.length > 0
          ? waybill.trackingEvents
          : [
              {
                status: waybill.currentStatus || 'Shipment Created',
                location: waybill.currentLocation || waybill.origin || 'Origin Facility',
                description: 'Initial tracking event created from waybill status.',
                eventTime: waybill.createdAt || new Date().toISOString(),
                isHold: Boolean(waybill.timelineOnHold),
              },
            ]

      setLoadedWaybill(waybill)
      setLookupValue(waybill.waybillNumber || query)
      setEvents(makeEditableEvents(sourceEvents))
      setHasUnsavedEdits(false)
      setTransitStartDate(waybill.transitStartDate || waybill.bookingDate || waybill.dateOfIssue || '')
      setTransitEndDate(waybill.transitEndDate || waybill.estimatedDeliveryDate || waybill.estimatedArrivalDate || '')
      setFeedback(`Loaded waybill ${waybill.waybillNumber}. You can now control its timeline.`)
    } catch (loadError) {
      console.error(loadError)
      setLoadedWaybill(null)
      setEvents([])
      setError(getWaybillErrorMessage(loadError, 'waybill lookup'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoad = async () => {
    await loadWaybill(lookupValue)
  }

  const handleRetryLoad = async () => {
    await loadWaybill(lastLookupAttempt || lookupValue)
  }

  // Core save function used by both auto-save (action buttons) and manual save (Save button).
  // applyTransitWindow: only true when triggered by the explicit Save button.
  const doSave = async (eventsToSave: EditableTimelineEvent[], applyTransitWindow = false) => {
    if (!loadedWaybill) return
    if (eventsToSave.length === 0) {
      setError('Timeline must have at least one event before saving.')
      return
    }

    setIsSaving(true)
    setFeedback(null)
    setError(null)

    try {
      let finalEvents = eventsToSave
      if (applyTransitWindow) {
        const startMs = Date.parse(transitStartDate)
        const endMs = Date.parse(transitEndDate)
        const hasValidWindow = !Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs
        if (hasValidWindow) {
          finalEvents = redistributeToTransitWindow(eventsToSave, transitStartDate, transitEndDate)
          setEvents(finalEvents)
        }
      }

      const updated = await updateWaybillTimeline(
        loadedWaybill.waybillNumber,
        toPersistedEvents(finalEvents),
        {
          transitStartDate: transitStartDate || undefined,
          transitEndDate: transitEndDate || undefined,
        },
      )
      if (!updated) {
        setError('Waybill could not be updated. Please reload and try again.')
        return
      }

      setLoadedWaybill(updated)
      setEvents(makeEditableEvents(updated.trackingEvents || []))
      setHasUnsavedEdits(false)
      setFeedback(
        applyTransitWindow
          ? `Timeline saved for ${updated.waybillNumber}. Runtime control is now active on tracking.`
          : 'Saved — changes are now live on tracking.',
      )
    } catch (saveError) {
      console.error(saveError)
      setError(getWaybillErrorMessage(saveError, 'timeline save'))
    } finally {
      setIsSaving(false)
    }
  }

  const updateEvent = (id: string, field: 'status' | 'location' | 'description' | 'eventTime', value: string) => {
    setHasUnsavedEdits(true)
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== id) return event
        if (field === 'eventTime') {
          return {
            ...event,
            eventTime: fromInputDateTime(value, event.eventTime),
          }
        }
        return { ...event, [field]: value }
      })
    )
  }

  const applyHold = (id: string, condition: string) => {
    const updated = events.map((event) =>
      event.id === id ? { ...event, isHold: true, holdCondition: condition } : event
    )
    setEvents(updated)
    setPendingHoldId(null)
    void doSave(updated)
  }

  const releaseHold = (id: string) => {
    const updated = events.map((event) =>
      event.id === id ? { ...event, isHold: false, holdCondition: undefined } : event
    )
    setEvents(updated)
    void doSave(updated)
  }

  const clearHolds = () => {
    const updated = events.map((event) => ({ ...event, isHold: false, holdCondition: undefined }))
    setEvents(updated)
    void doSave(updated)
  }

  const addEventAfter = (index: number) => {
    const reference = events[index]
    const baseTime = Date.parse(reference?.eventTime || '')
    const safeTime = Number.isNaN(baseTime) ? Date.now() : baseTime
    const newEvent: EditableTimelineEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'Manual Update',
      location: reference?.location || loadedWaybill?.destination || 'Destination Facility',
      description: 'Manual milestone inserted by admin.',
      eventTime: new Date(safeTime + 3 * 60 * 60 * 1000).toISOString(),
      isHold: false,
    }
    const next = [...events]
    next.splice(index + 1, 0, newEvent)
    setEvents(next)
    void doSave(next)
  }

  const removeEvent = (id: string) => {
    if (events.length <= 1) return
    const updated = events.filter((event) => event.id !== id)
    setEvents(updated)
    void doSave(updated)
  }

  const moveEvent = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= events.length) return
    const next = [...events]
    const [movedEvent] = next.splice(index, 1)
    next.splice(nextIndex, 0, movedEvent)
    setEvents(next)
    void doSave(next)
  }

  const handleSave = async () => {
    await doSave(events, true)
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Existing Waybill Timeline Control</h3>
          <p className="text-xs text-white/70">
            Load any waybill number, edit stages, apply holds or conditions, then save. Tracking portal updates live from this timeline.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={lookupValue}
          onChange={(event) => setLookupValue(event.target.value)}
          placeholder="Enter existing waybill number"
          className="logistics-input-control flex-1 px-4 py-3"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleLoad}
          disabled={isLoading}
          className="admin-action-secondary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Loading...' : 'Load Waybill'}
        </button>
      </div>

      {feedback && <p className="mt-3 text-sm text-emerald-200">{feedback}</p>}
      {isSaving && !feedback && (
        <p className="mt-3 text-sm text-[#9DC400]">Saving to tracking…</p>
      )}
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-200">{error}</p>
          {!isLoading && lastLookupAttempt && !hasLoadedWaybill && (
            <button
              type="button"
              onClick={handleRetryLoad}
              className="rounded-md border border-red-200/50 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/10"
            >
              Retry Load
            </button>
          )}
        </div>
      )}

      {hasLoadedWaybill && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-white/15 bg-[#0f2740] p-4">
            <p className="text-xs uppercase tracking-wide text-[#9DC400]">Runtime Preview</p>
            <div className="mt-2 grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-xs text-white/60">Current Status</p>
                <p className="font-semibold">{runtime.currentStatus}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Current Location</p>
                <p className="font-semibold">{runtime.currentLocation}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Timeline Hold</p>
                <p className="font-semibold">
                  {runtime.isOnHold
                    ? runtime.holdCondition
                      ? `Active — ${runtime.holdCondition}`
                      : 'Active'
                    : 'Not Active'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Progress</p>
                <p className="font-semibold">
                  {Math.round(runtime.progressRatio * 100)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Projected Completion</p>
                <p className="font-semibold">
                  {runtime.projectedCompletionDate
                    ? new Intl.DateTimeFormat(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(runtime.projectedCompletionDate))
                    : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Transit Period */}
          <div className="rounded-xl border border-[#9DC400]/30 bg-[#0f2740] p-4">
            <p className="text-xs uppercase tracking-wide text-[#9DC400]">Transit Period <span className="normal-case tracking-normal text-[#9DC400]/60">(Optional)</span></p>
            <p className="mt-1 mb-3 text-xs text-white/55">
              Set a shipment date and expected delivery. Saving will proportionally redistribute all timeline event timestamps to fit this window.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/75">Goods Sent Date</label>
                <input
                  type="datetime-local"
                  value={toInputDateTime(transitStartDate)}
                  onChange={(e) => { setTransitStartDate(fromInputDateTime(e.target.value, '')); setHasUnsavedEdits(true) }}
                  className="logistics-input-control w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/75">Expected Delivery Date</label>
                <input
                  type="datetime-local"
                  value={toInputDateTime(transitEndDate)}
                  onChange={(e) => { setTransitEndDate(fromInputDateTime(e.target.value, '')); setHasUnsavedEdits(true) }}
                  className="logistics-input-control w-full px-3 py-2 text-sm"
                />
              </div>
            </div>
            {transitStartDate && transitEndDate && Date.parse(transitEndDate) > Date.parse(transitStartDate) && (
              <p className="mt-2 text-xs text-[#d7ef7b]">
                Events will span from {new Date(transitStartDate).toLocaleString()} to {new Date(transitEndDate).toLocaleString()} on save.
              </p>
            )}
            {(transitStartDate || transitEndDate) && (
              <button
                type="button"
                onClick={() => { setTransitStartDate(''); setTransitEndDate(''); setHasUnsavedEdits(true) }}
                className="mt-2 text-xs text-white/40 underline hover:text-white/70 transition"
              >
                Clear transit period
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearHolds}
              disabled={isSaving}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Release All Holds
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="admin-action-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving…' : 'Save Timeline Changes'}
            </button>
            {hasUnsavedEdits && !isSaving && (
              <span className="text-xs text-amber-300/80">
                ● Field edits not yet saved — click Save Timeline Changes to apply.
              </span>
            )}
          </div>

          <div className="space-y-3">
            {events.map((event, index) => {
              const label = stateLabel(index, runtime.activeEventIndex, runtime.isOnHold)
              const isShowingConditionPicker = pendingHoldId === event.id
              return (
                <article key={event.id} className={`rounded-xl border p-3 ${stateClasses(label)}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                      {event.isHold && event.holdCondition && (
                        <span className="rounded-full border border-amber-300/50 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                          {event.holdCondition}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.isHold ? (
                        <button
                          type="button"
                          onClick={() => releaseHold(event.id)}
                          disabled={isSaving}
                          className="rounded-md border border-amber-300/50 bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Release Hold
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingHoldId(isShowingConditionPicker ? null : event.id)
                            setPendingCondition(HOLD_CONDITIONS[0])
                          }}
                          disabled={isSaving}
                          className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Apply Hold / Condition
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => moveEvent(index, -1)}
                        disabled={index === 0 || isSaving}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEvent(index, 1)}
                        disabled={index === events.length - 1 || isSaving}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Down
                      </button>
                      <button
                        type="button"
                        onClick={() => addEventAfter(index)}
                        disabled={isSaving}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Add Below
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEvent(event.id)}
                        disabled={events.length <= 1 || isSaving}
                        className="rounded-md border border-red-300/40 px-2 py-1 text-[11px] font-semibold text-red-100 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {isShowingConditionPicker && (
                    <div className="mb-3 rounded-lg border border-amber-300/40 bg-amber-400/10 p-3">
                      <p className="mb-2 text-xs font-semibold text-amber-200">Select Hold Condition</p>
                      <div className="flex flex-wrap gap-2">
                        {HOLD_CONDITIONS.map((cond) => (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => setPendingCondition(cond)}
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                              pendingCondition === cond
                                ? 'border-amber-300/70 bg-amber-400/30 text-amber-100'
                                : 'border-white/20 text-white/70 hover:border-amber-300/40 hover:bg-amber-400/10'
                            }`}
                          >
                            {cond}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => applyHold(event.id, pendingCondition)}
                          disabled={isSaving}
                          className="rounded-lg border border-amber-300/60 bg-amber-400/20 px-4 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Confirm Hold — {pendingCondition}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingHoldId(null)}
                          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/75">Status</label>
                      <input
                        type="text"
                        value={event.status}
                        onChange={(inputEvent) => updateEvent(event.id, 'status', inputEvent.target.value)}
                        className="logistics-input-control w-full px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/75">Location</label>
                      <input
                        type="text"
                        value={event.location}
                        onChange={(inputEvent) => updateEvent(event.id, 'location', inputEvent.target.value)}
                        className="logistics-input-control w-full px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-white/75">Description</label>
                      <textarea
                        value={event.description}
                        onChange={(inputEvent) => updateEvent(event.id, 'description', inputEvent.target.value)}
                        rows={2}
                        className="logistics-input-control w-full resize-none px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/75">Timestamp</label>
                      <input
                        type="datetime-local"
                        value={toInputDateTime(event.eventTime)}
                        onChange={(inputEvent) => updateEvent(event.id, 'eventTime', inputEvent.target.value)}
                        className="logistics-input-control w-full px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminTimelineControlPanel
