/**
 * Google Maps List Import Service
 *
 * Architecture:
 * - CID (Customer ID) is the canonical identifier for URLs
 * - CID is extracted from Feature ID pairs: ["ID1","ID2"] where ID2 is the CID
 * - All locations use CID-based URLs: https://maps.google.com/?cid=XXX
 * - Entries without CID are excluded (no valid link possible)
 *
 * Data structure in HTML (verified):
 * [null,null,LAT,LNG],["ID1","CID"],"/g/PLACE_ID"],"PlaceName"
 *
 * Order: Coordinates → Feature ID → /g/ → Name
 */

export interface ParsedLocation {
  name: string
  latitude: number
  longitude: number
  cid: string  // Required - all entries must have CID
  googleMapsUrl: string  // Derived from CID
}

export interface ParseListResult {
  success: boolean
  locations?: ParsedLocation[]
  listName?: string
  error?: string
  stats?: {
    total: number
    withCid: number
    withoutCid: number  // These are excluded from results
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
 * Constructs a Google Maps URL from a CID (Customer ID)
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
 *
 * Structure: [null,null,LAT,LNG],["ID1","CID"],"/g/PLACE_ID"],"PlaceName"
 * Order: Coordinates → Feature ID → /g/ → Name
 */
function extractLocationsFromHtml(html: string): { locations: ParsedLocation[], stats: { total: number, withCid: number, withoutCid: number } } {
  const locations: ParsedLocation[] = []
  const seenCids = new Set<string>()

  // Find all /g/ patterns with names: /g/PLACE_ID"],"PlaceName"
  const placePattern = /\/g\/([A-Za-z0-9_-]+)"\],"([^"]+)"/g
  let foundCount = 0
  let withCidCount = 0
  let withoutCidCount = 0

  let match
  while ((match = placePattern.exec(html)) !== null) {
    foundCount++
    const name = match[2]
    const matchIndex = match.index

    // Skip invalid names
    if (!isValidPlaceName(name)) {
      continue
    }

    // Look BEFORE this match for coordinates and CID (within 500 chars)
    const searchStart = Math.max(0, matchIndex - 500)
    const searchBefore = html.substring(searchStart, matchIndex)

    // Find Feature ID pair BEFORE /g/: ["ID1","ID2"] or [["ID1","ID2"]]
    // CID is the second number
    const cidMatch = searchBefore.match(/\[\[?"?(-?\d{15,25})"?,\s*"?(-?\d{15,25})"?\]\]?(?=[^\]]*$)/)
    if (!cidMatch) {
      withoutCidCount++
      console.log(`[extractLocationsFromHtml] No CID found for: ${name}`)
      continue
    }

    let cid = cidMatch[2]  // Second number is CID

    // Convert negative CIDs to unsigned (64-bit)
    if (cid.startsWith('-')) {
      // JavaScript BigInt handles this conversion
      const signedCid = BigInt(cid)
      const unsignedCid = signedCid < 0n ? signedCid + BigInt('18446744073709551616') : signedCid
      cid = unsignedCid.toString()
    }

    // Find coordinates BEFORE the Feature ID: [null,null,LAT,LNG]
    const coordMatch = searchBefore.match(/\[null,null,(-?\d+\.?\d*),(-?\d+\.?\d*)\]/)
    if (!coordMatch) {
      withoutCidCount++
      console.log(`[extractLocationsFromHtml] No coords found for: ${name}`)
      continue
    }

    const lat = parseFloat(coordMatch[1])
    const lng = parseFloat(coordMatch[2])

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      withoutCidCount++
      continue
    }

    // Skip duplicates
    if (seenCids.has(cid)) {
      continue
    }
    seenCids.add(cid)

    withCidCount++
    locations.push({
      name: cleanPlaceName(name),
      latitude: lat,
      longitude: lng,
      cid: cid,
      googleMapsUrl: constructGoogleMapsUrlFromCid(cid)
    })
  }

  const stats = {
    total: locations.length,
    withCid: withCidCount,
    withoutCid: withoutCidCount
  }

  // Debug logging
  console.log(`[extractLocationsFromHtml] Found ${foundCount} /g/ patterns`)
  console.log(`[extractLocationsFromHtml] Results: ${withCidCount} with CID, ${withoutCidCount} without CID`)
  if (locations.length > 0) {
    console.log(`[extractLocationsFromHtml] Sample: ${locations[0].name} -> ${locations[0].googleMapsUrl}`)
  }

  return { locations, stats }
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
