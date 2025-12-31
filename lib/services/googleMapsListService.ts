/**
 * Google Maps List Import Service
 *
 * Architecture:
 * - google_place_id (/g/XXXXX) is the canonical identifier
 * - URLs are derived, not scraped
 * - Scraping is discovery, not truth
 *
 * Flow:
 * 1. Resolve short URL → full URL
 * 2. Fetch HTML
 * 3. Extract /g/PLACE_ID patterns (Tier 1: ~86% of items)
 * 4. Items without /g/ are marked for potential API fallback (Tier 3: ~14%)
 * 5. Construct Maps URLs from place IDs
 */

export interface ParsedLocation {
  name: string
  latitude: number
  longitude: number
  googlePlaceId: string | null  // The /g/XXXXX identifier
  googleMapsUrl: string | null  // Derived from googlePlaceId
  source: 'scraped' | 'api' | 'coords_only'  // Track how we got the data
}

export interface ParseListResult {
  success: boolean
  locations?: ParsedLocation[]
  listName?: string
  error?: string
  stats?: {
    total: number
    tier1: number  // Have /g/ pattern
    tier3: number  // No /g/ pattern
  }
}

/**
 * Resolves a Google Maps short URL to the full URL
 */
export async function resolveGoogleMapsUrl(shortUrl: string): Promise<{ success: boolean; fullUrl?: string; error?: string }> {
  try {
    // Validate it's a Google Maps URL
    if (!shortUrl.includes('maps.app.goo.gl') && !shortUrl.includes('google.com/maps')) {
      return { success: false, error: 'Invalid URL. Please provide a Google Maps list URL.' }
    }

    // If it's already a full URL, return it
    if (shortUrl.includes('google.com/maps')) {
      return { success: true, fullUrl: shortUrl }
    }

    // Resolve the short URL by following redirects
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
    })

    const fullUrl = response.url

    return { success: true, fullUrl }
  } catch (error) {
    console.error('Error resolving Google Maps URL:', error)
    return { success: false, error: 'Failed to resolve URL. Please check the link and try again.' }
  }
}

/**
 * Constructs a Google Maps URL from a /g/ place reference
 */
export function constructGoogleMapsUrl(googlePlaceId: string): string {
  return `https://www.google.com/maps/place//g/${googlePlaceId}`
}

/**
 * Constructs a Google Maps URL from a CID (Customer ID)
 * CID is the second number in the Feature ID pair
 */
export function constructGoogleMapsUrlFromCid(cid: string): string {
  return `https://maps.google.com/?cid=${cid}`
}

/**
 * Fetches and parses a Google Maps list page to extract locations
 */
export async function parseGoogleMapsList(url: string): Promise<ParseListResult> {
  try {
    // Step 1: Resolve URL if needed
    const resolveResult = await resolveGoogleMapsUrl(url)
    if (!resolveResult.success || !resolveResult.fullUrl) {
      return { success: false, error: resolveResult.error }
    }

    // Step 2: Fetch the list page
    const response = await fetch(resolveResult.fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch the Google Maps list. It may be private or unavailable.' }
    }

    const html = await response.text()

    // Step 3: Extract locations
    const { locations, stats } = extractLocationsFromHtml(html)

    if (locations.length === 0) {
      return { success: false, error: 'No locations found in this list. It may be empty or private.' }
    }

    // Try to extract list name
    const listName = extractListName(html)

    return { success: true, locations, listName, stats }
  } catch (error) {
    console.error('Error parsing Google Maps list:', error)
    return { success: false, error: 'Failed to parse the Google Maps list. Please try again.' }
  }
}

/**
 * Extracts location data from Google Maps list HTML
 * Primary strategy: Find /g/PLACE_ID patterns and associate with nearby names and coordinates
 */
function extractLocationsFromHtml(html: string): { locations: ParsedLocation[], stats: { total: number, tier1: number, tier3: number } } {
  const locations: ParsedLocation[] = []
  const seenPlaceIds = new Set<string>()
  const seenCoords = new Set<string>()

  // Step 1: Find all /g/PLACE_ID patterns with associated names
  // Pattern: /g/PLACE_ID"],"PlaceName" (handles both escaped and unescaped quotes)
  const placePatterns = [
    /\/g\/([A-Za-z0-9_-]+)"\],"([^"]+)"/g,           // Standard format
    /\/g\/([A-Za-z0-9_-]+)\\"\],\\?"([^"\\]+)\\?"/g, // Escaped quotes
  ]

  const placeMatches: Array<{ placeId: string, name: string, index: number }> = []

  for (const pattern of placePatterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(html)) !== null) {
      const placeId = match[1]
      if (!seenPlaceIds.has(placeId)) {
        seenPlaceIds.add(placeId)
        placeMatches.push({
          placeId,
          name: cleanPlaceName(match[2]),
          index: match.index
        })
      }
    }
  }

  // Step 2: Find all coordinates
  const coordsPattern = /\[null,null,(-?\d+\.?\d*),(-?\d+\.?\d*)\]/g
  const coordsList: Array<{ lat: number, lng: number, index: number }> = []
  let match

  while ((match = coordsPattern.exec(html)) !== null) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])

    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`
      if (!seenCoords.has(key)) {
        seenCoords.add(key)
        coordsList.push({ lat, lng, index: match.index })
      }
    }
  }

  // Step 3: Associate each /g/ place with its nearest coordinates
  for (const place of placeMatches) {
    // Find the closest coordinate that appears BEFORE this place pattern
    // (coordinates typically appear before the place ID in the data structure)
    let closestCoord: { lat: number, lng: number, index: number } | null = null
    let closestDistance = Infinity

    for (const coord of coordsList) {
      // Coordinate should be before the place pattern (within 2000 chars)
      const distance = place.index - coord.index
      if (distance > 0 && distance < 2000 && distance < closestDistance) {
        closestDistance = distance
        closestCoord = coord
      }
    }

    if (closestCoord && isValidPlaceName(place.name)) {
      locations.push({
        name: place.name,
        latitude: closestCoord.lat,
        longitude: closestCoord.lng,
        googlePlaceId: place.placeId,
        googleMapsUrl: constructGoogleMapsUrl(place.placeId),
        source: 'scraped'
      })

      // Mark this coordinate as used
      const coordKey = `${closestCoord.lat.toFixed(6)},${closestCoord.lng.toFixed(6)}`
      seenCoords.delete(coordKey)
    }
  }

  // Step 4: Handle Tier 3 - Coordinates without /g/ patterns
  // These entries have numeric Feature ID pairs - we can extract the CID (second number)
  const tier3Coords = coordsList.filter(coord => {
    // Check if this coord wasn't used by any Tier 1 location
    return !locations.some(loc =>
      Math.abs(loc.latitude - coord.lat) < 0.0001 &&
      Math.abs(loc.longitude - coord.lng) < 0.0001
    )
  })

  // For Tier 3 items, find the name and CID from the numeric ID pair
  for (const coord of tier3Coords) {
    const name = findNearbyName(html, coord.index)
    const cid = findNearbyCid(html, coord.index)

    if (name) {
      locations.push({
        name,
        latitude: coord.lat,
        longitude: coord.lng,
        googlePlaceId: cid ? `cid:${cid}` : null,  // Store CID with prefix to distinguish from /g/
        googleMapsUrl: cid ? constructGoogleMapsUrlFromCid(cid) : null,
        source: cid ? 'scraped' : 'coords_only'
      })
    }
  }

  const stats = {
    total: locations.length,
    tier1: locations.filter(l => l.googlePlaceId !== null).length,
    tier3: locations.filter(l => l.googlePlaceId === null).length
  }

  return { locations, stats }
}

/**
 * Finds a potential place name near a coordinate index in the HTML
 */
function findNearbyName(html: string, coordIndex: number): string | null {
  // Search 500 chars before the coordinate for quoted strings
  const searchStart = Math.max(0, coordIndex - 500)
  const searchArea = html.substring(searchStart, coordIndex)

  // Find quoted strings that look like place names
  const namePattern = /\\?"([^"\\]{3,80})\\?"/g
  const candidates: Array<{ name: string, score: number }> = []
  let match

  while ((match = namePattern.exec(searchArea)) !== null) {
    const name = match[1]
    let score = 0

    // Score based on name characteristics
    if (/[A-Z]/.test(name)) score += 20  // Has capitals
    if (name.includes(' ')) score += 15   // Multi-word
    if (name.length >= 5 && name.length <= 50) score += 10  // Good length

    // Penalties
    if (/^\d/.test(name)) score -= 50     // Starts with number
    if (/,\s*(Bengaluru|Bangalore|Karnataka)/i.test(name)) score -= 40  // Address
    if (/\d{6}/.test(name)) score -= 40   // PIN code
    if (name.includes('null')) score -= 100
    if (name.startsWith('http') || name.startsWith('/')) score -= 100

    if (score > 0 && isValidPlaceName(name)) {
      candidates.push({ name: cleanPlaceName(name), score })
    }
  }

  // Return highest scoring candidate
  candidates.sort((a, b) => b.score - a.score)
  return candidates.length > 0 ? candidates[0].name : null
}

/**
 * Finds the CID (Customer ID) near a coordinate index in the HTML
 * CID is the second number in Feature ID pairs like ["4300397785175526469","4511808842774827243"]
 */
function findNearbyCid(html: string, coordIndex: number): string | null {
  // Search within 1000 chars around the coordinate for Feature ID pairs
  const searchStart = Math.max(0, coordIndex - 500)
  const searchEnd = Math.min(html.length, coordIndex + 500)
  const searchArea = html.substring(searchStart, searchEnd)

  // Pattern for Feature ID pairs: ["ID1","ID2"] or [\"ID1\",\"ID2\"]
  // The second number is the CID
  const cidPatterns = [
    /\["(\d{15,25})","(-?\d{15,25})"\]/g,        // Standard format
    /\[\\"(\d{15,25})\\",\\"(-?\d{15,25})\\"\]/g, // Escaped format
  ]

  for (const pattern of cidPatterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(searchArea)
    if (match) {
      // Return the second ID (CID)
      const cid = match[2]
      // Validate it's a positive number (CIDs are positive)
      if (cid && !cid.startsWith('-') && cid.length >= 15) {
        return cid
      }
    }
  }

  return null
}

/**
 * Validates that a string looks like a place name
 */
function isValidPlaceName(name: string): boolean {
  if (name.length < 2 || name.length > 100) return false
  if (/^\d+$/.test(name)) return false  // Just numbers
  if (/^(No\.?|Plot|Gate|Building|Floor|Block|Sector)\s*#?\d/i.test(name)) return false
  if (/^\d+[\/\-,\s]/.test(name)) return false  // Starts with address number
  if (name.startsWith('http') || name.startsWith('/')) return false
  if (name.includes('null') || name.includes('\\u')) return false
  return true
}

/**
 * Cleans up a place name
 */
function cleanPlaceName(name: string): string {
  // Remove plus code prefix (e.g., "WH8X+Q46 The Coffee Brewery" -> "The Coffee Brewery")
  const plusCodeMatch = name.match(/^[A-Z0-9]{4}\+[A-Z0-9]+\s+(.+)$/i)
  if (plusCodeMatch) {
    return plusCodeMatch[1]
  }
  return name.trim()
}

/**
 * Extracts the list name from the HTML
 */
function extractListName(html: string): string | undefined {
  try {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    if (titleMatch) {
      return titleMatch[1].replace(/ - Google Maps$/, '').trim()
    }
  } catch (error) {
    console.error('Error extracting list name:', error)
  }
  return undefined
}
