'use client'

import { useMemo, useState } from 'react'
import type { StoredWaybill, TrackingEventRecord } from '@/lib/types'
import { computeRuntimeTrackingState, normalizeTrackingEvents } from '@/lib/trackingAutomation'
import {
  getWaybillByNumber,
  getWaybillErrorMessage,
  normalizeWaybillLookupInput,
  updateWaybillTimeline,
} from '@/services/waybillService'

interface EditableTimelineEvent extends TrackingEventRecord {
  id: string
}

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

export function AdminTimelineControlPanel() {
  const [lookupValue, setLookupValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastLookupAttempt, setLastLookupAttempt] = useState('')
  const [loadedWaybill, setLoadedWaybill] = useState<StoredWaybill | null>(null)
  const [events, setEvents] = useState<EditableTimelineEvent[]>([])

  const runtime = useMemo(() => computeRuntimeTrackingState(events), [events])
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

  const updateEvent = (id: string, field: 'status' | 'location' | 'description' | 'eventTime', value: string) => {
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

  const toggleHold = (id: string) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, isHold: !event.isHold } : event)))
  }

  const clearHolds = () => {
    setEvents((prev) => prev.map((event) => ({ ...event, isHold: false })))
  }

  const addEventAfter = (index: number) => {
    setEvents((prev) => {
      const reference = prev[index]
      const baseTime = Date.parse(reference?.eventTime || '')
      const safeTime = Number.isNaN(baseTime) ? Date.now() : baseTime
      const newEvent: EditableTimelineEvent = {
        id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'Manual Update',
        location: reference?.location || loadedWaybill?.destination || 'Destination Facility',
        description: 'Manual milestone inserted by admin control.',
        eventTime: new Date(safeTime + 3 * 60 * 60 * 1000).toISOString(),
        isHold: false,
      }

      const next = [...prev]
      next.splice(index + 1, 0, newEvent)
      return next
    })
  }

  const removeEvent = (id: string) => {
    setEvents((prev) => (prev.length <= 1 ? prev : prev.filter((event) => event.id !== id)))
  }

  const moveEvent = (index: number, direction: -1 | 1) => {
    setEvents((prev) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [event] = next.splice(index, 1)
      next.splice(nextIndex, 0, event)
      return next
    })
  }

  const handleSave = async () => {
    if (!loadedWaybill) return
    if (events.length === 0) {
      setError('Timeline must have at least one event before saving.')
      return
    }

    setIsSaving(true)
    setFeedback(null)
    setError(null)

    try {
      const updated = await updateWaybillTimeline(loadedWaybill.waybillNumber, toPersistedEvents(events))
      if (!updated) {
        setError('Waybill could not be updated. Please reload and try again.')
        return
      }

      setLoadedWaybill(updated)
      setEvents(makeEditableEvents(updated.trackingEvents || []))
      setFeedback(`Timeline saved for ${updated.waybillNumber}. Runtime control is now active on tracking.`)
    } catch (saveError) {
      console.error(saveError)
      setError(getWaybillErrorMessage(saveError, 'timeline save'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Existing Waybill Timeline Control</h3>
          <p className="text-xs text-white/70">
            Load any created waybill number, edit stages, apply or release hold, then save. Tracking portal updates from this timeline.
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
            <div className="mt-2 grid grid-cols-1 gap-3 text-sm text-white sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="font-semibold">{runtime.isOnHold ? 'Active' : 'Not Active'}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Progress</p>
                <p className="font-semibold">
                  {Math.max(runtime.reachedEventIndex + 1, 0)} / {runtime.events.length} milestones reached
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearHolds}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Release All Holds
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="admin-action-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Timeline Changes'}
            </button>
          </div>

          <div className="space-y-3">
            {events.map((event, index) => {
              const label = stateLabel(index, runtime.activeEventIndex, runtime.isOnHold)
              return (
                <article key={event.id} className={`rounded-xl border p-3 ${stateClasses(label)}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleHold(event.id)}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
                      >
                        {event.isHold ? 'Release Hold' : 'Apply Hold'}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEvent(index, -1)}
                        disabled={index === 0}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEvent(index, 1)}
                        disabled={index === events.length - 1}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Down
                      </button>
                      <button
                        type="button"
                        onClick={() => addEventAfter(index)}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
                      >
                        Add Below
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEvent(event.id)}
                        disabled={events.length <= 1}
                        className="rounded-md border border-red-300/40 px-2 py-1 text-[11px] font-semibold text-red-100 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

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
