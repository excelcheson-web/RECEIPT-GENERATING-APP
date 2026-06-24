export interface GeoPoint {
  lat: number
  lng: number
  label: string
  displayName: string
}

const memoryCache = new Map<string, GeoPoint | null>()

// Strip "Origin Air Hub - ", "Destination Port - " etc.
const ROUTE_PREFIX = /^(origin|destination)(?:\s+\w+)*\s*-\s*/i
// Strip trailing slash-codes like "/ ABCD"
const QUERY_CODE_SUFFIX = /\s*\/\s*[A-Z0-9-]{2,12}\s*$/i
// Strip leading IATA/ICAO codes: "LAX Los Angeles" → "Los Angeles"
const LEADING_IATA = /^([A-Z]{3,4})\s+(?=[A-Z])/

export function normalizeGeocodeQuery(location: string): string {
  const trimmed = (location || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  return trimmed
    .replace(ROUTE_PREFIX, '')
    .replace(QUERY_CODE_SUFFIX, '')
    .replace(LEADING_IATA, '')
    .trim()
}

// Progressively simpler queries to try when an airport name fails
function buildFallbacks(query: string): string[] {
  const fallbacks: string[] = [query]

  const withoutIntl = query.replace(/\s+international\s+airport\s*$/i, ' Airport').trim()
  if (withoutIntl !== query) fallbacks.push(withoutIntl)

  const withoutAirport = query.replace(/\s+(international\s+)?airport\s*$/i, '').trim()
  if (withoutAirport !== query && withoutAirport !== withoutIntl) fallbacks.push(withoutAirport)

  const withoutPort = query.replace(/\s+(international\s+)?(sea)?port(\s+terminal)?\s*$/i, '').trim()
  if (withoutPort !== query) fallbacks.push(withoutPort)

  return [...new Set(fallbacks)]
}

async function nominatimSearch(query: string, signal?: AbortSignal): Promise<GeoPoint | null> {
  const key = query.toLowerCase()
  const cached = memoryCache.get(key)
  if (cached !== undefined) return cached

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', query)

  const response = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json', 'Accept-Language': 'en' },
  })
  if (!response.ok) throw new Error(`Nominatim error ${response.status}`)

  const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>
  const first = results[0]
  if (!first) {
    memoryCache.set(key, null)
    return null
  }

  const point: GeoPoint = {
    lat: Number.parseFloat(first.lat),
    lng: Number.parseFloat(first.lon),
    label: query,
    displayName: first.display_name,
  }
  if (Number.isNaN(point.lat) || Number.isNaN(point.lng)) {
    memoryCache.set(key, null)
    return null
  }

  memoryCache.set(key, point)
  return point
}

async function geocodeQuery(query: string, signal?: AbortSignal): Promise<GeoPoint | null> {
  const normalized = normalizeGeocodeQuery(query)
  if (!normalized) return null

  for (const attempt of buildFallbacks(normalized)) {
    if (signal?.aborted) return null
    try {
      const result = await nominatimSearch(attempt, signal)
      if (result) return result
    } catch {
      if (signal?.aborted) return null
    }
  }
  return null
}

export async function geocodeRouteLocations(
  origin: string,
  destination: string,
  signal?: AbortSignal,
): Promise<{ origin: GeoPoint | null; destination: GeoPoint | null }> {
  const [originPoint, destinationPoint] = await Promise.all([
    geocodeQuery(origin, signal).catch(() => null),
    geocodeQuery(destination, signal).catch(() => null),
  ])
  return { origin: originPoint, destination: destinationPoint }
}
