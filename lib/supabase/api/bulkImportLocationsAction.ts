"use server"

import { createClient } from "./supabaseServer"
import { toggleLocationUpvoteAction } from "./toggleLocationUpvoteAction"
import { ParsedLocation } from "@/lib/services/googleMapsListService"

export interface BulkImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  error?: string
}

/**
 * Server action to bulk import locations from a parsed Google Maps list
 *
 * Architecture:
 * - CID is the canonical identifier for deduplication
 * - google_maps_url is derived from CID
 * - All locations have CID (guaranteed by parser)
 */
export async function bulkImportLocationsAction(
  mapId: string,
  locations: ParsedLocation[]
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  }

  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        ...result,
        success: false,
        error: "You must be logged in to import locations",
      }
    }

    // Check if user is the map owner
    const { data: mapData, error: mapError } = await supabase
      .from("maps")
      .select("owner_id")
      .eq("id", mapId)
      .single()

    if (mapError || !mapData) {
      return {
        ...result,
        success: false,
        error: "Map not found",
      }
    }

    const isOwner = mapData.owner_id === user.id

    // Get existing locations for duplicate detection
    const { data: existingLocations, error: existingError } = await supabase
      .from("locations")
      .select("name, latitude, longitude, google_maps_url")
      .eq("map_id", mapId)

    if (existingError) {
      return {
        ...result,
        success: false,
        error: "Failed to check existing locations",
      }
    }

    // Track imported CIDs to prevent duplicates within batch
    const importedCids = new Set<string>()
    const importedCoords = new Set<string>()

    // Process each location
    for (const location of locations) {
      try {
        // Validate coordinates
        if (
          isNaN(location.latitude) ||
          isNaN(location.longitude) ||
          location.latitude < -90 ||
          location.latitude > 90 ||
          location.longitude < -180 ||
          location.longitude > 180
        ) {
          result.skipped++
          result.errors.push(`${location.name}: Invalid coordinates`)
          continue
        }

        // Check for duplicates by CID (most reliable - CID is always present)
        if (importedCids.has(location.cid)) {
          result.skipped++
          continue
        }

        // Check if this CID's URL already exists
        const existingByUrl = existingLocations?.some(
          existing => existing.google_maps_url === location.googleMapsUrl
        )
        if (existingByUrl) {
          result.skipped++
          continue
        }

        // Check for duplicates by coordinates
        const coordKey = `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`
        if (importedCoords.has(coordKey)) {
          result.skipped++
          continue
        }

        const existingByCoords = existingLocations?.some(
          existing =>
            Math.abs(existing.latitude - location.latitude) < 0.00001 &&
            Math.abs(existing.longitude - location.longitude) < 0.00001
        )
        if (existingByCoords) {
          result.skipped++
          continue
        }

        // Determine the google_maps_url
        // Use the one from scraping if available, otherwise construct from coords
        const googleMapsUrl = location.googleMapsUrl ||
          `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`

        // Insert the location
        const { data, error } = await supabase
          .from("locations")
          .insert({
            map_id: mapId,
            creator_id: user.id,
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            google_maps_url: googleMapsUrl,
            note: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_approved: isOwner,
            status: isOwner ? "approved" : "pending",
            city: "Bangalore",
          })
          .select()
          .single()

        if (error) {
          result.errors.push(`${location.name}: ${error.message}`)
          result.skipped++
          continue
        }

        // Auto-upvote for the creator
        if (data) {
          try {
            await toggleLocationUpvoteAction(data.id)
          } catch {
            // Ignore upvote errors
          }
        }

        // Track success
        result.imported++
        importedCids.add(location.cid)
        importedCoords.add(coordKey)

        // Add to existing locations to prevent duplicates
        existingLocations?.push({
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          google_maps_url: googleMapsUrl,
        })

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (locationError) {
        result.errors.push(
          `${location.name}: ${locationError instanceof Error ? locationError.message : "Unknown error"}`
        )
        result.skipped++
      }
    }

    return result
  } catch (error) {
    console.error("Error in bulkImportLocationsAction:", error)
    return {
      ...result,
      success: false,
      error: error instanceof Error ? error.message : "Failed to import locations",
    }
  }
}
