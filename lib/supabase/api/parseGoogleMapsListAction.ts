"use server"

import { parseGoogleMapsList, ParseListResult } from "@/lib/services/googleMapsListService"

// Re-export the result type from the service
export type ParseGoogleMapsListResult = ParseListResult

/**
 * Server action to parse a Google Maps list URL and extract locations
 */
export async function parseGoogleMapsListAction(url: string): Promise<ParseGoogleMapsListResult> {
  try {
    if (!url || !url.trim()) {
      return { success: false, error: "Please provide a Google Maps list URL" }
    }

    const result = await parseGoogleMapsList(url.trim())
    return result
  } catch (error) {
    console.error("Error in parseGoogleMapsListAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse the Google Maps list",
    }
  }
}
