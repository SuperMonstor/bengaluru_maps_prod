/**
 * Google Maps List Import Service
 *
 * Extracts locations from Google Maps list pages using structural parsing.
 *
 * Architecture:
 * 1. Find the <script> containing location data (anchored by /g/ patterns)
 * 2. Locate the data array within the script (anchored by coordinate pattern)
 * 3. Unescape and parse the isolated array as JavaScript
 * 4. Recursively walk the structure, extracting by invariants not position
 * 5. Deduplicate by CID and validate coordinates
 */

export interface ParsedLocation {
  name: string
  latitude: number
  longitude: number
  cid: string
  googleMapsUrl: string
}

export interface ParseListResult {
  success: boolean
  locations?: ParsedLocation[]
  listName?: string
  error?: string
}

/**
 * Constructs a Google Maps URL from a CID
 */
export function constructGoogleMapsUrlFromCid(cid: string): string {
  return `https://maps.google.com/?cid=${cid}`
}

/**
 * Fetches and parses a Google Maps list page
 */
export async function parseGoogleMapsList(url: string): Promise<ParseListResult> {
  try {
    const fullUrl = await resolveUrl(url)
    if (!fullUrl) {
      return { success: false, error: 'Invalid URL. Please provide a Google Maps list URL.' }
    }

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch the Google Maps list.' }
    }

    const html = await response.text()
    const locations = extractLocations(html)

    if (locations.length === 0) {
      return { success: false, error: 'No locations found. The list may be empty or private.' }
    }

    const listName = extractListName(html)

    console.log(`[parseGoogleMapsList] Extracted ${locations.length} locations`)

    return { success: true, locations, listName }
  } catch (error) {
    console.error('Error parsing Google Maps list:', error)
    return { success: false, error: 'Failed to parse the Google Maps list.' }
  }
}

/**
 * Resolves short URLs to full URLs
 */
async function resolveUrl(url: string): Promise<string | null> {
  if (!url.includes('maps.app.goo.gl') && !url.includes('google.com/maps')) {
    return null
  }

  if (url.includes('google.com/maps')) {
    return url
  }

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return response.url
  } catch {
    return null
  }
}

/**
 * Step 1: Find the script tag containing location data
 *
 * Anchors on /g/ patterns which are unique to location entries
 */
function findLocationScript(html: string): string | null {
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g
  let bestScript: string | null = null
  let maxGCount = 0

  let match
  while ((match = scriptPattern.exec(html)) !== null) {
    const content = match[1]
    const gCount = (content.match(/\/g\//g) || []).length

    if (gCount > maxGCount) {
      maxGCount = gCount
      bestScript = content
    }
  }

  if (maxGCount === 0) {
    console.error('[findLocationScript] No script with /g/ patterns found')
    return null
  }

  console.log(`[findLocationScript] Found script with ${maxGCount} /g/ patterns`)
  return bestScript
}

/**
 * Step 2: Locate the data array within the script
 *
 * Anchors on coordinate pattern [null,null,LAT,LNG] which is structurally unique
 */
function extractDataArray(script: string): string | null {
  // Find coordinate pattern as anchor
  const coordPattern = /\[null,null,\d+\.\d+,\d+\.\d+\]/
  const coordMatch = script.match(coordPattern)

  if (!coordMatch || coordMatch.index === undefined) {
    console.error('[extractDataArray] No coordinate pattern found')
    return null
  }

  const anchorPos = coordMatch.index

  // Walk backwards to find the enclosing array start
  // We need to find the outermost [ that contains all location data
  // Look for a pattern like [[null,[ which typically starts location entries
  let arrayStart = -1
  let depth = 0

  for (let i = anchorPos - 1; i >= 0; i--) {
    if (script[i] === ']') depth++
    if (script[i] === '[') {
      depth--
      if (depth < 0) {
        // Found an unmatched [ - this could be our container
        // Keep going back to find the outermost one
        arrayStart = i
        depth = 0
      }
    }
  }

  if (arrayStart === -1) {
    console.error('[extractDataArray] Could not find array start')
    return null
  }

  // Now find the matching end bracket
  depth = 0
  let arrayEnd = -1

  for (let i = arrayStart; i < script.length; i++) {
    if (script[i] === '[') depth++
    if (script[i] === ']') depth--
    if (depth === 0) {
      arrayEnd = i + 1
      break
    }
  }

  if (arrayEnd === -1) {
    console.error('[extractDataArray] Could not find array end')
    return null
  }

  const arrayStr = script.slice(arrayStart, arrayEnd)
  console.log(`[extractDataArray] Extracted array of ${arrayStr.length} chars`)

  return arrayStr
}

/**
 * Step 3: Parse the isolated array string
 *
 * The array is embedded in a string context with escape sequences.
 * We need to properly unescape before parsing.
 */
function parseArray(arrayStr: string): unknown | null {
  // The data has multiple levels of escaping because it's inside a string literal.
  // We need to unescape all JS escape sequences properly.
  //
  // Order matters:
  // 1. \\\\ -> \ (escaped backslash)
  // 2. \\\" -> " (escaped quote inside nested string)
  // 3. \" -> " (escaped quote)
  // 4. \\n -> newline
  // 5. \\t -> tab
  // 6. \\uXXXX -> unicode (already handled by JS parser)

  let unescaped = arrayStr
    .replace(/\\\\/g, '\u0000')  // Placeholder for escaped backslash
    .replace(/\\"/g, '"')         // Unescape quotes
    .replace(/\u0000/g, '\\')     // Restore backslashes

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return Function(`"use strict"; return (${unescaped})`)()
  } catch (e) {
    console.error('[parseArray] Parse failed:', e)
    console.error('[parseArray] Start:', arrayStr.slice(0, 200))
    console.error('[parseArray] End:', arrayStr.slice(-200))
    return null
  }
}

/**
 * Checks if a string is a valid location name
 */
function isValidName(s: string): boolean {
  return (
    s.length >= 1 &&
    s.length <= 200 &&
    !s.startsWith('/g/') &&
    !s.startsWith('http') &&
    !/^\d+$/.test(s) &&
    !/^[A-Z0-9]{4}\+/.test(s) // Not a plus code
  )
}

/**
 * Extracts location data from a details array
 */
function extractDetailsFromArray(arr: unknown[]): {
  lat: number | null
  lng: number | null
  cid2: string | null
  placeId: string | null
} {
  let lat: number | null = null
  let lng: number | null = null
  let cid2: string | null = null
  let placeId: string | null = null

  for (const value of arr) {
    // Coordinates: [null, null, lat, lng]
    if (
      Array.isArray(value) &&
      value.length >= 4 &&
      value[0] === null &&
      value[1] === null &&
      typeof value[2] === 'number' &&
      typeof value[3] === 'number'
    ) {
      lat = value[2]
      lng = value[3]
    }

    // CID pair: ["CID1", "CID2"]
    if (
      Array.isArray(value) &&
      value.length === 2 &&
      typeof value[0] === 'string' &&
      typeof value[1] === 'string' &&
      /^\d{15,25}$/.test(value[0]) &&
      /^-?\d{15,25}$/.test(value[1])
    ) {
      cid2 = value[1]
    }

    // Place ID: /g/...
    if (typeof value === 'string' && value.startsWith('/g/')) {
      placeId = value
    }
  }

  return { lat, lng, cid2, placeId }
}

/**
 * Step 4: Extract locations from parsed data
 *
 * Two structure variants exist:
 *
 * Variant A (66 entries):
 * - entry[1] contains /g/, coords, CID
 * - entry[2] is name
 *
 * Variant B (13 entries):
 * - entry[1] contains coords (no /g/)
 * - entry[2] is name
 * - entry[8][1] contains CID
 *
 * We handle both by scanning flexibly.
 */
function walkAndExtract(
  node: unknown,
  results: ParsedLocation[],
  seen: Set<string>
): void {
  if (!Array.isArray(node)) return

  // Try to find location data from children
  let lat: number | null = null
  let lng: number | null = null
  let cid2: string | null = null
  let placeId: string | null = null
  let name: string | null = null

  // Scan all children for data
  for (const value of node) {
    // Check for name string
    if (typeof value === 'string' && isValidName(value) && !name) {
      name = value
    }

    // Check child arrays for details
    if (Array.isArray(value)) {
      // Look for /g/ pattern
      for (const v of value) {
        if (typeof v === 'string' && v.startsWith('/g/')) {
          placeId = v
        }
      }

      // Look for coordinates [null, null, lat, lng]
      for (const v of value) {
        if (
          Array.isArray(v) &&
          v.length >= 4 &&
          v[0] === null &&
          v[1] === null &&
          typeof v[2] === 'number' &&
          typeof v[3] === 'number'
        ) {
          lat = v[2]
          lng = v[3]
        }
      }

      // Look for CID pair ["CID1", "CID2"]
      for (const v of value) {
        if (
          Array.isArray(v) &&
          v.length === 2 &&
          typeof v[0] === 'string' &&
          typeof v[1] === 'string' &&
          /^\d{15,25}$/.test(v[0]) &&
          /^-?\d{15,25}$/.test(v[1])
        ) {
          cid2 = v[1]
        }
      }

      // Variant B: CID might be in a nested array like entry[8][1]
      // Look for [[1], ["CID1", "CID2"]] pattern
      if (
        value.length === 2 &&
        Array.isArray(value[1]) &&
        value[1].length === 2 &&
        typeof value[1][0] === 'string' &&
        typeof value[1][1] === 'string' &&
        /^\d{15,25}$/.test(value[1][0]) &&
        /^-?\d{15,25}$/.test(value[1][1])
      ) {
        cid2 = value[1][1]
      }
    }
  }

  // Emit if we have enough data (name, coords, CID)
  // placeId is optional for Variant B entries
  if (
    name &&
    lat !== null &&
    lng !== null &&
    cid2 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    const cid = toUnsignedCid(cid2)

    if (!seen.has(cid)) {
      seen.add(cid)
      results.push({
        name: cleanName(name),
        latitude: lat,
        longitude: lng,
        cid,
        googleMapsUrl: constructGoogleMapsUrlFromCid(cid),
      })
    }
  }

  // Recurse into child arrays
  for (const value of node) {
    if (Array.isArray(value)) {
      walkAndExtract(value, results, seen)
    }
  }
}

/**
 * Step 5: Convert negative CID to unsigned 64-bit format
 */
function toUnsignedCid(cid: string): string {
  if (!cid.startsWith('-')) {
    return cid
  }
  const signed = BigInt(cid)
  const unsigned = signed < BigInt(0) ? signed + BigInt('18446744073709551616') : signed
  return unsigned.toString()
}

/**
 * Step 6: Clean place names
 */
function cleanName(name: string): string {
  // Decode unicode escapes (e.g., \u0026 -> &)
  let decoded = name.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )

  // Remove plus codes (e.g., "WH8X+Q46 Coffee Shop" -> "Coffee Shop")
  const plusCode = decoded.match(/^[A-Z0-9]{4}\+[A-Z0-9]+\s+(.+)$/i)
  if (plusCode) return plusCode[1]

  return decoded.trim()
}

/**
 * Main extraction pipeline
 */
function extractLocations(html: string): ParsedLocation[] {
  // Step 1: Find the script containing location data
  const script = findLocationScript(html)
  if (!script) {
    return []
  }

  // Step 2: Locate the data array within the script
  const arrayStr = extractDataArray(script)
  if (!arrayStr) {
    return []
  }

  // Step 3: Parse the array
  const data = parseArray(arrayStr)
  if (!data) {
    return []
  }

  // Step 4: Walk and extract
  const results: ParsedLocation[] = []
  const seen = new Set<string>()
  walkAndExtract(data, results, seen)

  console.log(`[extractLocations] Found ${results.length} locations`)
  return results
}

/**
 * Extracts the list name from HTML title
 */
function extractListName(html: string): string | undefined {
  const match = html.match(/<title>([^<]+)<\/title>/)
  if (match) {
    return match[1].replace(/ - Google Maps$/, '').trim()
  }
  return undefined
}
