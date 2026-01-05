"use server"

import { createClient } from "./supabaseServer"
import { hasMapEditPermission } from "./permissionHelpers"

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

		// Check permission: user can delete if they are:
		// 1. The location creator, OR
		// 2. The map owner or a collaborator
		const isCreator = location.creator_id === user.id
		const canEditMap = await hasMapEditPermission(supabase, location.map_id, user.id)

		if (!isCreator && !canEditMap) {
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
