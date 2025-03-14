"use server"

import { createClient } from "./supabaseServer"

export async function deleteLocationAction(locationId: string) {
	try {
		const supabase = await createClient()

		// Get the current user
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return {
				success: false,
				error: "You must be logged in to delete a location",
			}
		}

		// Get the location and its associated map
		const { data: location, error: locationError } = await supabase
			.from("locations")
			.select("id, map_id, creator_id")
			.eq("id", locationId)
			.single()

		if (locationError) {
			return {
				success: false,
				error: `Failed to find location: ${locationError.message}`,
			}
		}

		// Get the map to check ownership
		const { data: map, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", location.map_id)
			.single()

		if (mapError) {
			return {
				success: false,
				error: `Failed to find map: ${mapError.message}`,
			}
		}

		// Only allow deletion if user is the map owner or the location creator
		if (map.owner_id !== user.id && location.creator_id !== user.id) {
			return {
				success: false,
				error: "You don't have permission to delete this location",
			}
		}

		// Delete the location
		const { error: deleteError } = await supabase
			.from("locations")
			.delete()
			.eq("id", locationId)

		if (deleteError) {
			return {
				success: false,
				error: `Failed to delete location: ${deleteError.message}`,
			}
		}

		return { success: true, error: null }
	} catch (error) {
		console.error("Error in deleteLocationAction:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
