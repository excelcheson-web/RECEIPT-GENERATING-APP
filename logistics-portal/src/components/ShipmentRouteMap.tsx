'use client'

import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import type { RuntimeTrackingState } from '@/lib/trackingAutomation'
import type { GeoPoint } from '@/lib/locationGeocoding'
import { geocodeRouteLocations, normalizeGeocodeQuery } from '@/lib/locationGeocoding'

interface ShipmentRouteMapProps {
  origin: string
  destination: string
  currentLocation: string
  runtime: RuntimeTrackingState
  shipmentMode?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI
}

function interpolateGreatCircle(start: GeoPoint, end: GeoPoint, fraction: number): L.LatLngLiteral {
  const t = clamp(fraction, 0, 1)

  const lat1 = toRadians(start.lat)
  const lon1 = toRadians(start.lng)
  const lat2 = toRadians(end.lat)
  const lon2 = toRadians(end.lng)

  const delta = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
  ))

  if (!Number.isFinite(delta) || delta === 0) {
    return { lat: start.lat, lng: start.lng }
  }

  const a = Math.sin((1 - t) * delta) / Math.sin(delta)
  const b = Math.sin(t * delta) / Math.sin(delta)

  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2)
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2)
  const z = a * Math.sin(lat1) + b * Math.sin(lat2)

  return {
    lat: toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lng: toDegrees(Math.atan2(y, x)),
  }
}

function buildRoutePoints(start: GeoPoint, end: GeoPoint, segments = 72): L.LatLngLiteral[] {
  const count = Math.max(segments, 2)
  return Array.from({ length: count + 1 }, (_, index) => interpolateGreatCircle(start, end, index / count))
}

function routeProgressLabel(progressRatio: number): string {
  return `${Math.round(clamp(progressRatio, 0, 1) * 100)}%`
}

function resolveMode(shipmentMode: string): 'air' | 'sea' | 'land' | 'door' {
  const m = shipmentMode.toUpperCase()
  if (m.includes('SEA') || m.includes('OCEAN')) return 'sea'
  if (m.includes('LAND') || m.includes('TRUCK') || m.includes('ROAD')) return 'land'
  if (m.includes('DOOR')) return 'door'
  return 'air'
}

function buildMovingMarkerSvg(mode: 'air' | 'sea' | 'land' | 'door', onHold: boolean): string {
  const color = onHold ? '#f59e0b' : '#9DC400'
  const glow = onHold ? 'rgba(245,158,11,0.6)' : 'rgba(157,196,0,0.6)'
  const ring = onHold ? 'rgba(245,158,11,0.18)' : 'rgba(157,196,0,0.18)'
  const border = onHold ? 'rgba(245,158,11,0.55)' : 'rgba(157,196,0,0.55)'
  const animClass = onHold ? 'tracking-map-marker--moving tracking-map-marker--on-hold' : 'tracking-map-marker--moving'

  const svgIcon: Record<typeof mode, string> = {
    air: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    sea: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
    land: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2.22-3c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12v9H8.22zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`,
    door: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M20 7l-8-4-8 4v14h16V7zm-10 9H8v-2h2v2zm0-4H8v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>`,
  }

  return `<span class="${animClass}" style="background:${ring};border-color:${border};box-shadow:0 0 0 10px ${ring},0 0 24px ${glow};">${svgIcon[mode]}</span>`
}

function buildMarkerIcon(kind: 'origin' | 'destination' | 'moving', shipmentMode: string, onHold = false): L.DivIcon {
  const modeLabel = resolveMode(shipmentMode)

  if (kind === 'moving') {
    return L.divIcon({
      className: `tracking-map-marker-icon tracking-map-marker-icon--moving tracking-map-marker-icon--${modeLabel}`,
      html: buildMovingMarkerSvg(modeLabel, onHold),
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    })
  }

  return L.divIcon({
    className: `tracking-map-marker-icon tracking-map-marker-icon--${kind} tracking-map-marker-icon--${modeLabel}`,
    html: `<span class="tracking-map-marker tracking-map-marker--${kind}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export const ShipmentRouteMap: React.FC<ShipmentRouteMapProps> = ({
  origin,
  destination,
  currentLocation,
  runtime,
  shipmentMode = 'AIR',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)
  const movingMarkerRef = useRef<L.Marker | null>(null)
  const hasFittedBoundsRef = useRef(false)

  const [geoState, setGeoState] = useState<{
    origin: GeoPoint | null
    destination: GeoPoint | null
    loading: boolean
    error: string | null
  }>({
    origin: null,
    destination: null,
    loading: true,
    error: null,
  })

  const [displayProgress, setDisplayProgress] = useState(runtime.progressRatio)

  const normalizedOrigin = useMemo(() => normalizeGeocodeQuery(origin), [origin])
  const normalizedDestination = useMemo(() => normalizeGeocodeQuery(destination), [destination])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    setGeoState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    geocodeRouteLocations(normalizedOrigin, normalizedDestination, controller.signal)
      .then((points) => {
        if (cancelled) return
        hasFittedBoundsRef.current = false
        setGeoState({
          origin: points.origin,
          destination: points.destination,
          loading: false,
          error: points.origin && points.destination ? null : 'Unable to resolve one or both route locations.',
        })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('[ShipmentRouteMap] geocoding failed', error)
        hasFittedBoundsRef.current = false
        setGeoState({
          origin: null,
          destination: null,
          loading: false,
          error: 'Unable to resolve route locations right now.',
        })
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [normalizedOrigin, normalizedDestination])

  // Animate progress smoothly — but stop animating when on hold (target is already fixed)
  useEffect(() => {
    const start = displayProgress
    const end = runtime.progressRatio
    if (Math.abs(end - start) < 0.0001) return
    const durationMs = runtime.isOnHold ? 300 : 650
    const startedAt = performance.now()
    let rafId = 0

    const step = (timestamp: number) => {
      const raw = clamp((timestamp - startedAt) / durationMs, 0, 1)
      const eased = 1 - (1 - raw) ** 3
      const next = start + (end - start) * eased
      setDisplayProgress(next)

      if (raw < 1) {
        rafId = window.requestAnimationFrame(step)
      }
    }

    rafId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(rafId)
  }, [runtime.progressRatio, runtime.isOnHold])

  const routePoints = useMemo(() => {
    if (!geoState.origin || !geoState.destination) return []
    return buildRoutePoints(geoState.origin, geoState.destination)
  }, [geoState.destination, geoState.origin])

  const movingPoint = useMemo(() => {
    if (!geoState.origin || !geoState.destination) return null
    return interpolateGreatCircle(geoState.origin, geoState.destination, displayProgress)
  }, [displayProgress, geoState.destination, geoState.origin])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      worldCopyJump: true,
      preferCanvas: true,
      minZoom: 2,
      maxZoom: 8,
      attributionControl: true,
    })

    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map)

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(mapContainerRef.current)

    const invalidate = window.setTimeout(() => {
      map.invalidateSize()
    }, 50)

    return () => {
      window.clearTimeout(invalidate)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      routeLineRef.current = null
      originMarkerRef.current = null
      destinationMarkerRef.current = null
      movingMarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!geoState.origin || !geoState.destination || routePoints.length === 0) {
      routeLineRef.current?.remove()
      routeLineRef.current = null
      originMarkerRef.current?.remove()
      originMarkerRef.current = null
      destinationMarkerRef.current?.remove()
      destinationMarkerRef.current = null
      movingMarkerRef.current?.remove()
      movingMarkerRef.current = null
      map.setView([20, 0], 2)
      return
    }

    const routeColor = runtime.isOnHold ? '#f59e0b' : '#9DC400'
    const bounds = L.latLngBounds(routePoints)

    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline(routePoints, {
        color: routeColor,
        weight: 3,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8 12',
      }).addTo(map)
    } else {
      routeLineRef.current.setLatLngs(routePoints)
      routeLineRef.current.setStyle({ color: routeColor })
    }

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker([geoState.origin.lat, geoState.origin.lng], {
        icon: buildMarkerIcon('origin', shipmentMode),
        interactive: false,
      }).addTo(map)
    } else {
      originMarkerRef.current.setLatLng([geoState.origin.lat, geoState.origin.lng])
      originMarkerRef.current.setIcon(buildMarkerIcon('origin', shipmentMode))
    }

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker([geoState.destination.lat, geoState.destination.lng], {
        icon: buildMarkerIcon('destination', shipmentMode),
        interactive: false,
      }).addTo(map)
    } else {
      destinationMarkerRef.current.setLatLng([geoState.destination.lat, geoState.destination.lng])
      destinationMarkerRef.current.setIcon(buildMarkerIcon('destination', shipmentMode))
    }

    if (!movingMarkerRef.current) {
      movingMarkerRef.current = L.marker([geoState.origin.lat, geoState.origin.lng], {
        icon: buildMarkerIcon('moving', shipmentMode, runtime.isOnHold),
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map)
    } else {
      movingMarkerRef.current.setIcon(buildMarkerIcon('moving', shipmentMode, runtime.isOnHold))
    }

    if (!hasFittedBoundsRef.current) {
      map.fitBounds(bounds.pad(0.25))
      hasFittedBoundsRef.current = true
    }
  }, [geoState.destination, geoState.origin, routePoints, shipmentMode, runtime.isOnHold])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !movingMarkerRef.current || !movingPoint) return
    movingMarkerRef.current.setLatLng([movingPoint.lat, movingPoint.lng])
  }, [movingPoint])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const timer = window.setTimeout(() => {
      map.invalidateSize()
    }, 60)

    return () => window.clearTimeout(timer)
  }, [geoState.destination, geoState.origin])

  const progressText = routeProgressLabel(displayProgress)
  const etaText = runtime.projectedCompletionDate
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(runtime.projectedCompletionDate))
    : 'Not available'

  const holdBadgeText = runtime.isOnHold
    ? runtime.holdCondition
      ? `Paused — ${runtime.holdCondition}`
      : 'Timeline paused'
    : 'Timeline active'

  return (
    <section className="logistics-card tracking-grid-overlay p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Route Map</h3>
          <p className="text-xs text-[#9fb7d4]">Real-world route with live position tracking</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            runtime.isOnHold
              ? 'border-amber-300/50 bg-amber-400/15 text-amber-200'
              : 'border-[#9DC400]/40 bg-[#9DC400]/10 text-[#d7ef7b]'
          }`}
        >
          {holdBadgeText}
        </span>
      </div>

      <div className="tracking-route-map-panel relative overflow-hidden rounded-2xl border border-[#314d6d] bg-[#071421]">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(7,20,33,0.14),rgba(7,20,33,0.5))]" />

        <div className="pointer-events-none absolute left-4 top-4 z-[2] space-y-2">
          <div className="rounded-xl border border-white/10 bg-[#0b1a2bcc] px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#92acd0]">Current</p>
            <p className="mt-1 max-w-[15rem] break-words text-sm font-semibold text-white">{currentLocation}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1a2bcc] px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#92acd0]">
              {runtime.isOnHold ? 'Revised delivery' : 'Projected delivery'}
            </p>
            <p className={`mt-1 text-sm font-semibold ${runtime.isOnHold ? 'text-amber-300' : 'text-[#d7ef7b]'}`}>
              {etaText}
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-[2] w-[11rem] rounded-xl border border-white/10 bg-[#0b1a2bcc] px-3 py-2 text-right backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#92acd0]">Progress</p>
          <p className="mt-1 text-2xl font-semibold text-white">{progressText}</p>
          <p className="text-xs text-[#9fb7d4]">{runtime.currentStatus}</p>
        </div>

        <div
          ref={mapContainerRef}
          className="tracking-route-map min-h-[420px] w-full sm:min-h-[520px]"
          aria-label="Shipment route map"
        />

        {(geoState.loading || geoState.error) && (
          <div className="absolute inset-x-0 bottom-0 z-[2] border-t border-white/10 bg-[#091521e6] px-4 py-3 backdrop-blur-md">
            <p className="text-sm font-medium text-white">
              {geoState.loading ? 'Locating departure and destination points...' : geoState.error}
            </p>
            <p className="mt-1 text-xs text-[#9fb7d4]">
              {normalizeGeocodeQuery(origin)} → {normalizeGeocodeQuery(destination)}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default ShipmentRouteMap
