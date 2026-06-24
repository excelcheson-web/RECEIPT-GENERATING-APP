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

// ─── Math helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
function toRad(d: number) { return (d * Math.PI) / 180 }
function toDeg(r: number) { return (r * 180) / Math.PI }

function interpolateGreatCircle(start: GeoPoint, end: GeoPoint, fraction: number): L.LatLngLiteral {
  const t = clamp(fraction, 0, 1)
  const lat1 = toRad(start.lat), lon1 = toRad(start.lng)
  const lat2 = toRad(end.lat),   lon2 = toRad(end.lng)
  const delta = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
  ))
  if (!Number.isFinite(delta) || delta === 0) return { lat: start.lat, lng: start.lng }
  const a = Math.sin((1 - t) * delta) / Math.sin(delta)
  const b = Math.sin(t * delta) / Math.sin(delta)
  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2)
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2)
  const z = a * Math.sin(lat1) + b * Math.sin(lat2)
  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) }
}

function buildRoutePoints(start: GeoPoint, end: GeoPoint, segments = 72): L.LatLngLiteral[] {
  const count = Math.max(segments, 2)
  return Array.from({ length: count + 1 }, (_, i) => interpolateGreatCircle(start, end, i / count))
}

// ─── Solar terminator ────────────────────────────────────────────────────────
// Returns two polygon rings that together cover the NIGHT side of the Earth.
// Algorithm adapted from the MIT-licensed leaflet-terminator library.

function calcNightPolygons(date: Date): L.LatLngLiteral[][] {
  const jd = date.getTime() / 86400000 + 2440587.5
  const n  = jd - 2451545.0

  const L0    = 280.460 + 0.9856474 * n
  const g     = toRad((357.528 + 0.9856003 * n) % 360)
  const lam   = toRad(L0 + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g))
  const eps   = toRad(23.439 - 0.0000004 * n)
  const decl  = Math.asin(Math.sin(eps) * Math.sin(lam))

  // Subsolar longitude
  const GMST  = (6.697375 + 0.0657098242 * n +
                  date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) % 24
  const RA    = toDeg(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)))
  const sunLon = ((RA - GMST * 15 + 180) % 360 + 360) % 360 - 180

  const step = 2
  const west: L.LatLngLiteral[] = []
  const east: L.LatLngLiteral[] = []

  for (let lat = -90 + step; lat < 90; lat += step) {
    const cosH = -Math.tan(toRad(lat)) * Math.tan(decl)
    if (cosH > 1 || cosH < -1) continue
    const H = toDeg(Math.acos(cosH))
    west.push({ lat, lng: sunLon - H })
    east.push({ lat, lng: sunLon + H })
  }

  if (west.length === 0) return []

  const sunLat = toDeg(decl)
  let poly1: L.LatLngLiteral[]
  let poly2: L.LatLngLiteral[]

  if (sunLat > 0) {
    // Northern summer: south pole in polar night
    poly1 = [{ lat: 90, lng: west[0].lng }, ...west, { lat: -90, lng: west[west.length - 1].lng }, { lat: -90, lng: west[0].lng - 360 }, { lat: 90, lng: west[0].lng - 360 }]
    poly2 = [{ lat: 90, lng: east[0].lng }, ...east, { lat: -90, lng: east[east.length - 1].lng }, { lat: -90, lng: east[0].lng + 360 }, { lat: 90, lng: east[0].lng + 360 }]
  } else {
    // Southern summer: north pole in polar night
    poly1 = [{ lat: -90, lng: west[0].lng }, ...west, { lat: 90, lng: west[west.length - 1].lng }, { lat: 90, lng: west[0].lng - 360 }, { lat: -90, lng: west[0].lng - 360 }]
    poly2 = [{ lat: -90, lng: east[0].lng }, ...east, { lat: 90, lng: east[east.length - 1].lng }, { lat: 90, lng: east[0].lng + 360 }, { lat: -90, lng: east[0].lng + 360 }]
  }

  return [poly1, poly2]
}

// ─── Marker helpers ───────────────────────────────────────────────────────────

function resolveMode(shipmentMode: string): 'air' | 'sea' | 'land' | 'door' {
  const m = shipmentMode.toUpperCase()
  if (m.includes('SEA') || m.includes('OCEAN')) return 'sea'
  if (m.includes('LAND') || m.includes('TRUCK') || m.includes('ROAD')) return 'land'
  if (m.includes('DOOR')) return 'door'
  return 'air'
}

function buildMovingMarkerSvg(mode: 'air' | 'sea' | 'land' | 'door', onHold: boolean): string {
  const color = onHold ? '#f59e0b' : '#9DC400'
  const glow  = onHold ? 'rgba(245,158,11,0.6)' : 'rgba(157,196,0,0.6)'
  const ring  = onHold ? 'rgba(245,158,11,0.18)' : 'rgba(157,196,0,0.18)'
  const border = onHold ? 'rgba(245,158,11,0.55)' : 'rgba(157,196,0,0.55)'
  const cls   = onHold ? 'tracking-map-marker--moving tracking-map-marker--on-hold' : 'tracking-map-marker--moving'

  const icons: Record<typeof mode, string> = {
    air:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    sea:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
    land: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2.22-3c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12v9H8.22zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`,
    door: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${color}" style="filter:drop-shadow(0 0 4px ${glow})"><path d="M20 7l-8-4-8 4v14h16V7zm-10 9H8v-2h2v2zm0-4H8v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>`,
  }

  return `<span class="${cls}" style="background:${ring};border-color:${border};box-shadow:0 0 0 10px ${ring},0 0 24px ${glow};">${icons[mode]}</span>`
}

function buildMarkerIcon(kind: 'origin' | 'destination' | 'moving', shipmentMode: string, onHold = false): L.DivIcon {
  const m = resolveMode(shipmentMode)
  if (kind === 'moving') {
    return L.divIcon({ className: `tracking-map-marker-icon tracking-map-marker-icon--moving tracking-map-marker-icon--${m}`, html: buildMovingMarkerSvg(m, onHold), iconSize: [38, 38], iconAnchor: [19, 19] })
  }
  return L.divIcon({ className: `tracking-map-marker-icon tracking-map-marker-icon--${kind} tracking-map-marker-icon--${m}`, html: `<span class="tracking-map-marker tracking-map-marker--${kind}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] })
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ShipmentRouteMap: React.FC<ShipmentRouteMapProps> = ({
  origin,
  destination,
  currentLocation,
  runtime,
  shipmentMode = 'AIR',
}) => {
  const mapContainerRef   = useRef<HTMLDivElement | null>(null)
  const mapRef            = useRef<L.Map | null>(null)
  const glowLineRef       = useRef<L.Polyline | null>(null)
  const routeLineRef      = useRef<L.Polyline | null>(null)
  const originMarkerRef   = useRef<L.Marker | null>(null)
  const destMarkerRef     = useRef<L.Marker | null>(null)
  const movingMarkerRef   = useRef<L.Marker | null>(null)
  const nightPolyRef      = useRef<L.Polygon | null>(null)
  const hasFittedRef      = useRef(false)

  const [geoState, setGeoState] = useState<{ origin: GeoPoint | null; destination: GeoPoint | null; loading: boolean; error: string | null }>({
    origin: null, destination: null, loading: true, error: null,
  })

  const [displayProgress, setDisplayProgress] = useState(runtime.progressRatio)

  const normalizedOrigin      = useMemo(() => normalizeGeocodeQuery(origin),      [origin])
  const normalizedDestination = useMemo(() => normalizeGeocodeQuery(destination), [destination])

  // Geocode
  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    setGeoState((p) => ({ ...p, loading: true, error: null }))

    geocodeRouteLocations(normalizedOrigin, normalizedDestination, ctrl.signal)
      .then((pts) => {
        if (cancelled) return
        hasFittedRef.current = false
        setGeoState({ origin: pts.origin, destination: pts.destination, loading: false, error: pts.origin && pts.destination ? null : 'Unable to resolve one or both route locations.' })
      })
      .catch(() => {
        if (cancelled) return
        hasFittedRef.current = false
        setGeoState({ origin: null, destination: null, loading: false, error: 'Unable to resolve route locations right now.' })
      })

    return () => { cancelled = true; ctrl.abort() }
  }, [normalizedOrigin, normalizedDestination])

  // Smooth progress animation
  useEffect(() => {
    const start = displayProgress
    const end   = runtime.progressRatio
    if (Math.abs(end - start) < 0.0001) return
    const dur = runtime.isOnHold ? 300 : 650
    const t0  = performance.now()
    let raf = 0
    const step = (now: number) => {
      const raw   = clamp((now - t0) / dur, 0, 1)
      const eased = 1 - (1 - raw) ** 3
      setDisplayProgress(start + (end - start) * eased)
      if (raw < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [runtime.progressRatio, runtime.isOnHold])

  const routePoints = useMemo(() => {
    if (!geoState.origin || !geoState.destination) return []
    return buildRoutePoints(geoState.origin, geoState.destination)
  }, [geoState.origin, geoState.destination])

  const movingPoint = useMemo(() => {
    if (!geoState.origin || !geoState.destination) return null
    return interpolateGreatCircle(geoState.origin, geoState.destination, displayProgress)
  }, [displayProgress, geoState.origin, geoState.destination])

  // Initialise map once
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

    // NASA VIIRS city-lights at night — glowing cities on black space
    L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/2015-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg', {
      maxNativeZoom: 8,
      maxZoom: 8,
      attribution: 'Imagery: <a href="https://earthdata.nasa.gov">NASA GIBS</a>',
      crossOrigin: 'anonymous',
    }).addTo(map)

    // Day-side overlay: semi-transparent blue tinted polygon covering the lit half
    // Initialised immediately; updated every minute via the terminator effect below
    const polys = calcNightPolygons(new Date())
    if (polys.length === 2) {
      nightPolyRef.current = L.polygon(polys as L.LatLngExpression[][], {
        fillColor: '#0a2545',
        fillOpacity: 0.55,
        color: '#4da6ff',
        weight: 1.5,
        opacity: 0.55,
        interactive: false,
        smoothFactor: 1,
      }).addTo(map)
    }

    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(mapContainerRef.current)
    const tid = window.setTimeout(() => map.invalidateSize(), 50)

    return () => {
      window.clearTimeout(tid)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      glowLineRef.current = null
      routeLineRef.current = null
      originMarkerRef.current = null
      destMarkerRef.current = null
      movingMarkerRef.current = null
      nightPolyRef.current = null
    }
  }, [])

  // Refresh terminator every 60 s
  useEffect(() => {
    const refresh = () => {
      const poly = nightPolyRef.current
      if (!poly) return
      const polys = calcNightPolygons(new Date())
      if (polys.length === 2) poly.setLatLngs(polys as L.LatLngExpression[][])
    }
    const id = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Route + markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!geoState.origin || !geoState.destination || routePoints.length === 0) {
      glowLineRef.current?.remove();  glowLineRef.current = null
      routeLineRef.current?.remove(); routeLineRef.current = null
      originMarkerRef.current?.remove(); originMarkerRef.current = null
      destMarkerRef.current?.remove();   destMarkerRef.current = null
      movingMarkerRef.current?.remove(); movingMarkerRef.current = null
      map.setView([20, 0], 2)
      return
    }

    const routeColor = runtime.isOnHold ? '#f59e0b' : '#9DC400'
    const bounds     = L.latLngBounds(routePoints)

    if (!glowLineRef.current) {
      glowLineRef.current = L.polyline(routePoints, { color: routeColor, weight: 18, opacity: 0.12, lineCap: 'round', lineJoin: 'round' }).addTo(map)
    } else {
      glowLineRef.current.setLatLngs(routePoints)
      glowLineRef.current.setStyle({ color: routeColor })
    }

    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline(routePoints, { color: routeColor, weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round', dashArray: '8 12' }).addTo(map)
    } else {
      routeLineRef.current.setLatLngs(routePoints)
      routeLineRef.current.setStyle({ color: routeColor })
    }

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker([geoState.origin.lat, geoState.origin.lng], { icon: buildMarkerIcon('origin', shipmentMode), interactive: false }).addTo(map)
    } else {
      originMarkerRef.current.setLatLng([geoState.origin.lat, geoState.origin.lng])
      originMarkerRef.current.setIcon(buildMarkerIcon('origin', shipmentMode))
    }

    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker([geoState.destination.lat, geoState.destination.lng], { icon: buildMarkerIcon('destination', shipmentMode), interactive: false }).addTo(map)
    } else {
      destMarkerRef.current.setLatLng([geoState.destination.lat, geoState.destination.lng])
      destMarkerRef.current.setIcon(buildMarkerIcon('destination', shipmentMode))
    }

    if (!movingMarkerRef.current) {
      movingMarkerRef.current = L.marker([geoState.origin.lat, geoState.origin.lng], { icon: buildMarkerIcon('moving', shipmentMode, runtime.isOnHold), interactive: false, zIndexOffset: 1000 }).addTo(map)
    } else {
      movingMarkerRef.current.setIcon(buildMarkerIcon('moving', shipmentMode, runtime.isOnHold))
    }

    if (!hasFittedRef.current) {
      map.fitBounds(bounds.pad(0.25))
      hasFittedRef.current = true
    }
  }, [geoState.origin, geoState.destination, routePoints, shipmentMode, runtime.isOnHold])

  // Move marker
  useEffect(() => {
    if (!mapRef.current || !movingMarkerRef.current || !movingPoint) return
    movingMarkerRef.current.setLatLng([movingPoint.lat, movingPoint.lng])
  }, [movingPoint])

  // Invalidate size when geo resolves
  useEffect(() => {
    const id = window.setTimeout(() => mapRef.current?.invalidateSize(), 60)
    return () => window.clearTimeout(id)
  }, [geoState.origin, geoState.destination])

  const progressText = `${Math.round(clamp(displayProgress, 0, 1) * 100)}%`
  const etaText = runtime.projectedCompletionDate
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(runtime.projectedCompletionDate))
    : 'Not available'

  const holdBadgeText = runtime.isOnHold
    ? runtime.holdCondition ? `Paused — ${runtime.holdCondition}` : 'Timeline paused'
    : 'Timeline active'

  const glowColor  = runtime.isOnHold ? 'rgba(245,158,11,0.18)' : 'rgba(157,196,0,0.18)'
  const glowBorder = runtime.isOnHold ? 'rgba(245,158,11,0.3)'  : 'rgba(157,196,0,0.28)'
  const etaColor   = runtime.isOnHold ? 'text-amber-300' : 'text-[#d7ef7b]'

  return (
    <section
      className="logistics-card p-5 sm:p-6"
      style={{ boxShadow: `0 0 48px ${glowColor}, 0 16px 30px rgba(0,0,0,0.28)` }}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Route Map</h3>
          <p className="text-xs text-[#9fb7d4]">Real-world route · night-side city lights · live position</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${runtime.isOnHold ? 'border-amber-300/50 bg-amber-400/15 text-amber-200' : 'border-[#9DC400]/40 bg-[#9DC400]/10 text-[#d7ef7b]'}`}>
          {holdBadgeText}
        </span>
      </div>

      {/* Info panels — above the map so they never overlap */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-white/10 bg-[#0b1a2b]/80 px-4 py-3 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#92acd0]">Current</p>
          <p className="mt-1 text-sm font-semibold text-white leading-snug wrap-break-word">{currentLocation}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1a2b]/80 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#92acd0]">
            {runtime.isOnHold ? 'Revised delivery' : 'Projected delivery'}
          </p>
          <p className={`mt-1 text-sm font-semibold ${etaColor}`}>{etaText}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1a2b]/80 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#92acd0]">Progress</p>
          <p className="mt-1 text-2xl font-bold text-white">{progressText}</p>
          <p className="text-xs text-[#9fb7d4]">{runtime.currentStatus}</p>
        </div>
      </div>

      {/* Map canvas — clean, no absolute overlays */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          border: `1px solid ${glowBorder}`,
          boxShadow: `0 0 0 1px ${glowColor}, 0 0 32px ${glowColor}, 0 0 72px rgba(157,196,0,0.05)`,
        }}
      >
        <div
          ref={mapContainerRef}
          className="tracking-route-map w-full"
          style={{ minHeight: '320px', height: 'clamp(320px, 42vw, 500px)' }}
          aria-label="Shipment route map showing day/night and live position"
        />

        {(geoState.loading || geoState.error) && (
          <div className="absolute inset-x-0 bottom-0 z-2 border-t border-white/10 bg-[#091521]/90 px-4 py-3 backdrop-blur-md">
            <p className="text-sm font-medium text-white">
              {geoState.loading ? 'Locating departure and destination…' : geoState.error}
            </p>
            {geoState.error && (
              <p className="mt-0.5 text-xs text-[#9fb7d4]">
                {normalizeGeocodeQuery(origin)} → {normalizeGeocodeQuery(destination)}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ShipmentRouteMap
