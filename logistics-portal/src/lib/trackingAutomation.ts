import type { StoredWaybill, TrackingEventRecord } from '@/lib/types'

export interface RuntimeTrackingState {
  events: TrackingEventRecord[]
  activeEventIndex: number
  reachedEventIndex: number
  holdEventIndex: number
  isOnHold: boolean
  holdCondition: string
  currentStatus: string
  currentLocation: string
  progressRatio: number
  projectedCompletionDate: string
}

function normalizeEventTime(eventTime: string, fallbackTime: string): string {
  const parsed = Date.parse(eventTime || '')
  if (Number.isNaN(parsed)) return fallbackTime
  return new Date(parsed).toISOString()
}

export function normalizeTrackingEvents(events: TrackingEventRecord[], fallbackLocation = 'Origin Facility'): TrackingEventRecord[] {
  const now = new Date().toISOString()
  const unique = new Map<string, TrackingEventRecord>()

  events.forEach((event, index) => {
    const normalized: TrackingEventRecord = {
      status: (event.status || 'Status Update').trim() || 'Status Update',
      location: (event.location || fallbackLocation).trim() || fallbackLocation,
      description: (event.description || 'No description provided.').trim() || 'No description provided.',
      eventTime: normalizeEventTime(event.eventTime, now),
      isHold: Boolean(event.isHold),
      holdCondition: event.isHold && event.holdCondition ? event.holdCondition.trim() : undefined,
    }

    const key = `${normalized.status}|${normalized.location}|${normalized.description}|${normalized.eventTime}|${normalized.isHold ? '1' : '0'}|${normalized.holdCondition || ''}|${index}`
    unique.set(key, normalized)
  })

  return Array.from(unique.values()).sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime))
}

export function computeRuntimeTrackingState(events: TrackingEventRecord[], now: Date = new Date()): RuntimeTrackingState {
  const normalized = normalizeTrackingEvents(events)
  if (normalized.length === 0) {
    return {
      events: [],
      activeEventIndex: -1,
      reachedEventIndex: -1,
      holdEventIndex: -1,
      isOnHold: false,
      holdCondition: '',
      currentStatus: 'Shipment Created',
      currentLocation: 'Origin Facility',
      progressRatio: 0,
      projectedCompletionDate: '',
    }
  }

  const nowMs = now.getTime()
  let reachedEventIndex = -1
  normalized.forEach((event, index) => {
    if (Date.parse(event.eventTime) <= nowMs) {
      reachedEventIndex = index
    }
  })

  const holdEventIndex = normalized.findIndex((event) => event.isHold)
  const hasReachedAny = reachedEventIndex >= 0
  let activeEventIndex = hasReachedAny ? reachedEventIndex : 0
  let isOnHold = false

  if (holdEventIndex >= 0 && reachedEventIndex >= holdEventIndex) {
    activeEventIndex = holdEventIndex
    isOnHold = true
  }

  const lastIndex = normalized.length - 1
  const firstMs = Date.parse(normalized[0]?.eventTime || '')
  const lastMs = Date.parse(normalized[lastIndex]?.eventTime || '')
  const projectedCompletionDate =
    Number.isNaN(lastMs) || lastMs <= 0 ? normalized[lastIndex]?.eventTime || '' : new Date(lastMs).toISOString()

  let progressRatio = 0
  if (isOnHold && holdEventIndex >= 0) {
    progressRatio = lastIndex <= 0 ? 1 : holdEventIndex / lastIndex
  } else if (!Number.isNaN(firstMs) && !Number.isNaN(lastMs) && lastMs > firstMs) {
    progressRatio = Math.min(Math.max((nowMs - firstMs) / (lastMs - firstMs), 0), 1)
  } else if (lastIndex > 0) {
    progressRatio = Math.min(Math.max(reachedEventIndex / lastIndex, 0), 1)
  } else {
    progressRatio = 1
  }

  const activeEvent = normalized[activeEventIndex] || normalized[0]
  const baseStatus = activeEvent?.status || 'Shipment Created'
  const holdCondition = isOnHold ? (activeEvent?.holdCondition || '') : ''
  const holdLabel = holdCondition ? ` — ${holdCondition}` : ' (On Hold)'

  return {
    events: normalized,
    activeEventIndex,
    reachedEventIndex,
    holdEventIndex,
    isOnHold,
    holdCondition,
    currentStatus: isOnHold ? `${baseStatus}${holdLabel}` : baseStatus,
    currentLocation: activeEvent?.location || 'Origin Facility',
    progressRatio,
    projectedCompletionDate,
  }
}

export function applyRuntimeToWaybill(waybill: StoredWaybill, now: Date = new Date()): StoredWaybill {
  const fallbackLocation = waybill.origin || waybill.portOfDeparture || 'Origin Facility'
  const runtime = computeRuntimeTrackingState(
    normalizeTrackingEvents(Array.isArray(waybill.trackingEvents) ? waybill.trackingEvents : [], fallbackLocation),
    now
  )

  const deliveredReached =
    runtime.activeEventIndex >= 0 &&
    runtime.activeEventIndex === runtime.events.length - 1 &&
    !runtime.isOnHold &&
    runtime.currentStatus.toLowerCase().includes('delivered')
  const projectedCompletionDate: string =
    runtime.projectedCompletionDate ||
    waybill.estimatedDeliveryDate ||
    waybill.estimatedArrivalDate ||
    ''

  return {
    ...waybill,
    trackingEvents: runtime.events,
    currentStatus: runtime.currentStatus,
    currentLocation: runtime.currentLocation,
    timelineOnHold: runtime.isOnHold,
    estimatedDeliveryDate: projectedCompletionDate,
    estimatedArrivalDate: projectedCompletionDate || waybill.estimatedArrivalDate,
    arrivalDate: projectedCompletionDate || waybill.arrivalDate,
    ...(deliveredReached && { deliveredDate: runtime.events[runtime.activeEventIndex].eventTime }),
  }
}
