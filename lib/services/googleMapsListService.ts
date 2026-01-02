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
 * Signals collected during tree walk
 */
type Signals = {
  lat?: number
  lng?: number
  cid?: string
  name?: string
}

/**
 * Step 4: Signal-based structural extraction
 *
 * Walks the parsed data tree, collecting signals (lat, lng, cid, name)
 * as they bubble up from children. Emits a location when all four
 * signals are present.
 *
 * This approach naturally handles structural variants without
 * hardcoding specific array indices.
 */
function walkAndExtract(
  node: unknown,
  results: ParsedLocation[],
  seen: Set<string>
): Signals {
  if (!Array.isArray(node)) return {}

  let signals: Signals = {}

  for (const v of node) {
    // Name signal: first valid string
    if (typeof v === 'string' && isValidName(v) && !signals.name) {
      signals.name = v
    }

    // Coordinate signal: [null, null, lat, lng]
    if (
      Array.isArray(v) &&
      v.length >= 4 &&
      v[0] === null &&
      v[1] === null &&
      typeof v[2] === 'number' &&
      typeof v[3] === 'number'
    ) {
      signals.lat = v[2]
      signals.lng = v[3]
    }

    // CID signal: ["CID1", "CID2"]
    if (
      Array.isArray(v) &&
      v.length === 2 &&
      typeof v[0] === 'string' &&
      typeof v[1] === 'string' &&
      /^\d{15,25}$/.test(v[0]) &&
      /^-?\d{15,25}$/.test(v[1])
    ) {
      signals.cid = toUnsignedCid(v[1])
    }

    // Recurse into child arrays and merge signals (first value wins)
    if (Array.isArray(v)) {
      const child = walkAndExtract(v, results, seen)
      signals = {
        lat: signals.lat ?? child.lat,
        lng: signals.lng ?? child.lng,
        cid: signals.cid ?? child.cid,
        name: signals.name ?? child.name,
      }
    }
  }

  // Emit if we have all four signals with valid coordinates
  if (
    signals.lat !== undefined &&
    signals.lng !== undefined &&
    signals.cid &&
    signals.name &&
    signals.lat >= -90 &&
    signals.lat <= 90 &&
    signals.lng >= -180 &&
    signals.lng <= 180
  ) {
    if (!seen.has(signals.cid)) {
      seen.add(signals.cid)
      results.push({
        name: cleanName(signals.name),
        latitude: signals.lat,
        longitude: signals.lng,
        cid: signals.cid,
        googleMapsUrl: constructGoogleMapsUrlFromCid(signals.cid),
      })
    }
  }

  return signals
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
