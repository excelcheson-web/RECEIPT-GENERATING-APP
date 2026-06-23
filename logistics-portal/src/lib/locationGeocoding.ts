export interface GeoPoint {
  lat: number
  lng: number
  label: string
  displayName: string
}

const memoryCache = new Map<string, GeoPoint | null>()
const QUERY_CODE_SUFFIX = /\s*\/\s*[A-Z0-9-]{2,12}\s*$/i
const ROUTE_PREFIX = /^(origin|destination)(?:\s+\w+)*\s*-\s*/i

export function normalizeGeocodeQuery(location: string): string {
  const trimmed = (location || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''

  const withoutPrefix = trimmed.replace(ROUTE_PREFIX, '')
  return withoutPrefix.replace(QUERY_CODE_SUFFIX, '').trim()
}

async function geocodeQuery(query: string, signal?: AbortSignal): Promise<GeoPoint | null> {
  const normalized = normalizeGeocodeQuery(query)
  if (!normalized) return null

  const cached = memoryCache.get(normalized.toLowerCase())
  if (cached !== undefined) return cached

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', normalized)

  const response = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to geocode "${normalized}".`)
  }

  const results = (await response.json()) as Array<{
    lat: string
    lon: string
    display_name: string
  }>
  const first = results[0]
  if (!first) {
    memoryCache.set(normalized.toLowerCase(), null)
    return null
  }

  const point: GeoPoint = {
    lat: Number.parseFloat(first.lat),
    lng: Number.parseFloat(first.lon),
    label: normalized,
    displayName: first.display_name,
  }

  if (Number.isNaN(point.lat) || Number.isNaN(point.lng)) {
    memoryCache.set(normalized.toLowerCase(), null)
    return null
  }

  memoryCache.set(normalized.toLowerCase(), point)
  return point
}

export async function geocodeRouteLocations(
  origin: string,
  destination: string,
  signal?: AbortSignal
): Promise<{ origin: GeoPoint | null; destination: GeoPoint | null }> {
  const [originPoint, destinationPoint] = await Promise.all([
    geocodeQuery(origin, signal).catch(() => null),
    geocodeQuery(destination, signal).catch(() => null),
  ])

  return {
    origin: originPoint,
    destination: destinationPoint,
  }
}
