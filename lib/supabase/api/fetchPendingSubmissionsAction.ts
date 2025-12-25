"use server"

import { createClient } from "./supabaseServer"

export async function fetchPendingSubmissionsAction(mapId: string) {
	try {
		const supabase = await createClient()

		// Get the current user from server-side auth
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return {
				success: false,
				error: "You must be logged in to view pending submissions",
				data: null,
			}
		}

		// Check if user is the map owner
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			return {
				success: false,
				error: `Failed to fetch map: ${mapError.message}`,
				data: null,
			}
		}

		// Security check: Only map owner can view pending submissions
		if (mapData.owner_id !== user.id) {
			return {
				success: false,
				error: "You do not have permission to view pending submissions for this map",
				data: null,
			}
		}

		// Fetch pending submissions
		const { data, error } = await supabase
			.from("locations")
			.select(
				`
        id,
        map_id,
        name,
        google_maps_url,
        note,
        creator_id,
        status,
        users!locations_creator_id_fkey (
          first_name,
          last_name,
          picture_url
        )
      `
			)
			.eq("map_id", mapId)
			.eq("status", "pending")

		if (error) {
			return {
				success: false,
				error: `Failed to fetch pending submissions: ${error.message}`,
				data: null,
			}
		}

		return {
			success: true,
			error: null,
			data,
		}
	} catch (error) {
		console.error("Error in fetchPendingSubmissionsAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
			data: null,
		}
	}
}
