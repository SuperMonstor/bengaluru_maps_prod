"use server"

import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Check if a user has edit permission on a map (owner or collaborator)
 * This is a server-side helper that takes an existing supabase client
 */
export async function hasMapEditPermission(
	supabase: SupabaseClient,
	mapId: string,
	userId: string
): Promise<boolean> {
	try {
		// First check if user is owner
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			console.error("Error checking map ownership:", mapError)
			return false
		}

		if (mapData.owner_id === userId) {
			return true
		}

		// Check if user is collaborator
		const { data: collabData, error: collabError } = await supabase
			.from("map_collaborators")
			.select("id")
			.eq("map_id", mapId)
			.eq("user_id", userId)
			.single()

		if (collabError && collabError.code !== "PGRST116") {
			// PGRST116 = no rows found, which is expected if not a collaborator
			console.error("Error checking collaborator status:", collabError)
			return false
		}

		return !!collabData
	} catch (error) {
		console.error("Error in hasMapEditPermission:", error)
		return false
	}
}

/**
 * Check if user is the owner of a map
 */
export async function isMapOwner(
	supabase: SupabaseClient,
	mapId: string,
	userId: string
): Promise<boolean> {
	try {
		const { data, error } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (error) {
			return false
		}

		return data.owner_id === userId
	} catch {
		return false
	}
}
