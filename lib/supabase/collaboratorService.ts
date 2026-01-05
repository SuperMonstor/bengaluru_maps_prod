import { createClient } from "./api/supabaseClient"
import { CollaboratorWithUser, MapCollaborator } from "@/lib/types/mapTypes"

const supabase = createClient()

export interface CollaboratorResult {
	data: CollaboratorWithUser[] | null
	error: string | null
}

export interface SingleCollaboratorResult {
	data: MapCollaborator | null
	error: string | null
}

export interface MapByTokenResult {
	data: {
		id: string
		name: string
		short_description: string
		display_picture: string | null
		owner_id: string
		slug: string
		owner: {
			first_name: string | null
			last_name: string | null
			picture_url: string | null
		}
	} | null
	error: string | null
}

export interface InviteTokenResult {
	data: { invite_token: string } | null
	error: string | null
}

/**
 * Generate or regenerate an invite token for a map
 * Only the map owner can do this
 */
export async function generateInviteToken(
	mapId: string,
	userId: string
): Promise<InviteTokenResult> {
	try {
		// Verify user is the map owner
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			throw new Error(`Map not found: ${mapError.message}`)
		}

		if (mapData.owner_id !== userId) {
			throw new Error("Only the map owner can generate invite links")
		}

		// Generate new token using crypto.randomUUID()
		const newToken = crypto.randomUUID()

		// Update the map with new token
		const { data, error } = await supabase
			.from("maps")
			.update({ invite_token: newToken })
			.eq("id", mapId)
			.select("invite_token")
			.single()

		if (error) {
			throw new Error(`Failed to generate invite token: ${error.message}`)
		}

		return { data: { invite_token: data.invite_token }, error: null }
	} catch (error) {
		console.error("Error in generateInviteToken:", error)
		return {
			data: null,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Get a map by its invite token
 * Used when a user clicks an invite link
 */
export async function getMapByInviteToken(token: string): Promise<MapByTokenResult> {
	try {
		const { data, error } = await supabase
			.from("maps")
			.select(`
				id,
				name,
				short_description,
				display_picture,
				owner_id,
				slug,
				users!maps_owner_id_fkey (
					first_name,
					last_name,
					picture_url
				)
			`)
			.eq("invite_token", token)
			.single()

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Invalid or expired invite link")
			}
			throw new Error(`Failed to fetch map: ${error.message}`)
		}

		const owner = data.users as unknown as {
			first_name: string | null
			last_name: string | null
			picture_url: string | null
		}

		return {
			data: {
				id: data.id,
				name: data.name,
				short_description: data.short_description,
				display_picture: data.display_picture,
				owner_id: data.owner_id,
				slug: data.slug,
				owner,
			},
			error: null,
		}
	} catch (error) {
		console.error("Error in getMapByInviteToken:", error)
		return {
			data: null,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Add a user as a collaborator to a map
 */
export async function addCollaborator(
	mapId: string,
	userId: string
): Promise<SingleCollaboratorResult> {
	try {
		// Check if user is already a collaborator
		const { data: existing } = await supabase
			.from("map_collaborators")
			.select("id")
			.eq("map_id", mapId)
			.eq("user_id", userId)
			.single()

		if (existing) {
			throw new Error("You are already a collaborator on this map")
		}

		// Check if user is the owner (owners shouldn't be collaborators)
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			throw new Error(`Map not found: ${mapError.message}`)
		}

		if (mapData.owner_id === userId) {
			throw new Error("You are the owner of this map")
		}

		// Add collaborator
		const { data, error } = await supabase
			.from("map_collaborators")
			.insert({
				map_id: mapId,
				user_id: userId,
				role: "editor",
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to add collaborator: ${error.message}`)
		}

		return { data, error: null }
	} catch (error) {
		console.error("Error in addCollaborator:", error)
		return {
			data: null,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Remove a collaborator from a map
 * Can be done by map owner or the collaborator themselves
 */
export async function removeCollaborator(
	mapId: string,
	collaboratorUserId: string,
	requestingUserId: string
): Promise<{ success: boolean; error: string | null }> {
	try {
		// Check if requesting user has permission (owner or self-removal)
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			throw new Error(`Map not found: ${mapError.message}`)
		}

		const isOwner = mapData.owner_id === requestingUserId
		const isSelfRemoval = collaboratorUserId === requestingUserId

		if (!isOwner && !isSelfRemoval) {
			throw new Error("You don't have permission to remove this collaborator")
		}

		// Remove collaborator
		const { error } = await supabase
			.from("map_collaborators")
			.delete()
			.eq("map_id", mapId)
			.eq("user_id", collaboratorUserId)

		if (error) {
			throw new Error(`Failed to remove collaborator: ${error.message}`)
		}

		return { success: true, error: null }
	} catch (error) {
		console.error("Error in removeCollaborator:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Get all collaborators for a map
 */
export async function getCollaborators(mapId: string): Promise<CollaboratorResult> {
	try {
		const { data, error } = await supabase
			.from("map_collaborators")
			.select(`
				id,
				map_id,
				user_id,
				role,
				joined_at,
				users!map_collaborators_user_id_fkey (
					id,
					first_name,
					last_name,
					picture_url
				)
			`)
			.eq("map_id", mapId)
			.order("joined_at", { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch collaborators: ${error.message}`)
		}

		// Transform the data to match CollaboratorWithUser type
		const collaborators: CollaboratorWithUser[] = (data || []).map((collab: any) => ({
			id: collab.id,
			map_id: collab.map_id,
			user_id: collab.user_id,
			role: collab.role,
			joined_at: collab.joined_at,
			user: collab.users,
		}))

		return { data: collaborators, error: null }
	} catch (error) {
		console.error("Error in getCollaborators:", error)
		return {
			data: null,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Check if a user is a collaborator on a map
 */
export async function isCollaborator(
	mapId: string,
	userId: string
): Promise<boolean> {
	try {
		const { data, error } = await supabase
			.from("map_collaborators")
			.select("id")
			.eq("map_id", mapId)
			.eq("user_id", userId)
			.single()

		if (error) {
			// PGRST116 means no rows found, which is not an error for this check
			if (error.code === "PGRST116") {
				return false
			}
			console.error("Error checking collaborator status:", error)
			return false
		}

		return !!data
	} catch (error) {
		console.error("Error in isCollaborator:", error)
		return false
	}
}

/**
 * Check if a user has edit permission on a map (owner or collaborator)
 */
export async function hasMapEditPermission(
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
		return await isCollaborator(mapId, userId)
	} catch (error) {
		console.error("Error in hasMapEditPermission:", error)
		return false
	}
}

/**
 * Get the invite token for a map (only for owner)
 */
export async function getInviteToken(
	mapId: string,
	userId: string
): Promise<InviteTokenResult> {
	try {
		const { data, error } = await supabase
			.from("maps")
			.select("owner_id, invite_token")
			.eq("id", mapId)
			.single()

		if (error) {
			throw new Error(`Map not found: ${error.message}`)
		}

		if (data.owner_id !== userId) {
			throw new Error("Only the map owner can view the invite link")
		}

		return { data: { invite_token: data.invite_token }, error: null }
	} catch (error) {
		console.error("Error in getInviteToken:", error)
		return {
			data: null,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
