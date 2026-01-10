"use server"

import { createClient } from "./supabaseServer"
import { CollaboratorWithUser } from "@/lib/types/mapTypes"

interface ActionResult<T = undefined> {
	success: boolean
	error: string | null
	data?: T
}

/**
 * Generate or regenerate an invite token for a map
 * Only the map owner can do this
 */
export async function generateInviteTokenAction(
	mapId: string
): Promise<ActionResult<{ inviteToken: string; inviteUrl: string }>> {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in" }
		}

		// Verify user is the map owner
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			return { success: false, error: `Map not found: ${mapError.message}` }
		}

		if (mapData.owner_id !== user.id) {
			return { success: false, error: "Only the map owner can generate invite links" }
		}

		// Generate new token
		const newToken = crypto.randomUUID()

		// Update the map with new token
		const { data, error } = await supabase
			.from("maps")
			.update({ invite_token: newToken })
			.eq("id", mapId)
			.select("invite_token")
			.single()

		if (error) {
			return { success: false, error: `Failed to generate invite token: ${error.message}` }
		}

		const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bengalurumaps.com"
		const inviteUrl = `${baseUrl}/invite/${data.invite_token}`

		return {
			success: true,
			error: null,
			data: {
				inviteToken: data.invite_token,
				inviteUrl,
			},
		}
	} catch (error) {
		console.error("Error in generateInviteTokenAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Get the invite token and URL for a map
 * Only the map owner can do this
 */
export async function getInviteTokenAction(
	mapId: string
): Promise<ActionResult<{ inviteToken: string | null; inviteUrl: string | null }>> {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in" }
		}

		const { data, error } = await supabase
			.from("maps")
			.select("owner_id, invite_token")
			.eq("id", mapId)
			.single()

		if (error) {
			return { success: false, error: `Map not found: ${error.message}` }
		}

		if (data.owner_id !== user.id) {
			return { success: false, error: "Only the map owner can view the invite link" }
		}

		const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bengalurumaps.com"
		const inviteUrl = data.invite_token ? `${baseUrl}/invite/${data.invite_token}` : null

		return {
			success: true,
			error: null,
			data: {
				inviteToken: data.invite_token,
				inviteUrl,
			},
		}
	} catch (error) {
		console.error("Error in getInviteTokenAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Get map details by invite token (for the acceptance page)
 * This can be called by anyone with the token
 */
export async function getMapByInviteTokenAction(token: string): Promise<
	ActionResult<{
		id: string
		name: string
		shortDescription: string
		displayPicture: string | null
		slug: string
		ownerName: string
		ownerPicture: string | null
		isAlreadyCollaborator: boolean
		isOwner: boolean
	}>
> {
	try {
		// Validate token is a valid UUID format
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
		if (!uuidRegex.test(token)) {
			return { success: false, error: "Invalid or expired invite link" }
		}

		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		const { data, error } = await supabase
			.from("maps")
			.select(
				`
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
			`
			)
			.eq("invite_token", token)
			.single()

		if (error) {
			// Return user-friendly error for any database errors
			return { success: false, error: "Invalid or expired invite link" }
		}

		const owner = data.users as unknown as {
			first_name: string | null
			last_name: string | null
			picture_url: string | null
		}

		// Check if user is already a collaborator or owner
		let isAlreadyCollaborator = false
		let isOwner = false

		if (user) {
			isOwner = data.owner_id === user.id

			if (!isOwner) {
				const { data: collabData } = await supabase
					.from("map_collaborators")
					.select("id")
					.eq("map_id", data.id)
					.eq("user_id", user.id)
					.single()

				isAlreadyCollaborator = !!collabData
			}
		}

		return {
			success: true,
			error: null,
			data: {
				id: data.id,
				name: data.name,
				shortDescription: data.short_description,
				displayPicture: data.display_picture,
				slug: data.slug,
				ownerName: `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || "Unknown",
				ownerPicture: owner.picture_url,
				isAlreadyCollaborator,
				isOwner,
			},
		}
	} catch (error) {
		console.error("Error in getMapByInviteTokenAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Accept an invite and become a collaborator
 */
export async function acceptInviteAction(
	token: string
): Promise<ActionResult<{ mapSlug: string }>> {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in to accept an invite" }
		}

		// Get map by token with owner details for email notification
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select(`
				id,
				owner_id,
				slug,
				name,
				users!maps_owner_id_fkey (
					email
				)
			`)
			.eq("invite_token", token)
			.single()

		if (mapError) {
			if (mapError.code === "PGRST116") {
				return { success: false, error: "Invalid or expired invite link" }
			}
			return { success: false, error: `Failed to fetch map: ${mapError.message}` }
		}

		// Check if user is the owner
		if (mapData.owner_id === user.id) {
			return { success: false, error: "You are the owner of this map" }
		}

		// Check if already a collaborator
		const { data: existingCollab } = await supabase
			.from("map_collaborators")
			.select("id")
			.eq("map_id", mapData.id)
			.eq("user_id", user.id)
			.single()

		if (existingCollab) {
			return { success: false, error: "You are already a collaborator on this map" }
		}

		// Add as collaborator
		const { error: insertError } = await supabase.from("map_collaborators").insert({
			map_id: mapData.id,
			user_id: user.id,
			role: "editor",
		})

		if (insertError) {
			return { success: false, error: `Failed to join as collaborator: ${insertError.message}` }
		}

		// Send email notification to map owner
		try {
			// Get collaborator's name
			const { data: collaboratorData } = await supabase
				.from("users")
				.select("first_name, last_name")
				.eq("id", user.id)
				.single()

			const owner = mapData.users as unknown as { email: string | null }
			const ownerEmail = owner?.email

			if (ownerEmail && collaboratorData) {
				const collaboratorName = `${collaboratorData.first_name || ""} ${collaboratorData.last_name || ""}`.trim() || "Someone"
				const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bengalurumaps.com"
				const mapUrl = `${baseUrl}/maps/${mapData.slug}`

				// Call the email API
				await fetch(`${baseUrl}/api/email/collaborator-joined`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						ownerEmail,
						mapTitle: mapData.name,
						collaboratorName,
						mapUrl,
					}),
				})
			}
		} catch (emailError) {
			// Log error but don't fail the invite acceptance
			console.error("Error sending collaborator joined email:", emailError)
		}

		return {
			success: true,
			error: null,
			data: { mapSlug: mapData.slug },
		}
	} catch (error) {
		console.error("Error in acceptInviteAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Remove a collaborator from a map
 * Can be done by map owner or the collaborator themselves
 */
export async function removeCollaboratorAction(
	mapId: string,
	collaboratorUserId: string
): Promise<ActionResult> {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in" }
		}

		// Check if requesting user has permission (owner or self-removal)
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			return { success: false, error: `Map not found: ${mapError.message}` }
		}

		const isOwner = mapData.owner_id === user.id
		const isSelfRemoval = collaboratorUserId === user.id

		if (!isOwner && !isSelfRemoval) {
			return { success: false, error: "You don't have permission to remove this collaborator" }
		}

		// Remove collaborator
		const { error } = await supabase
			.from("map_collaborators")
			.delete()
			.eq("map_id", mapId)
			.eq("user_id", collaboratorUserId)

		if (error) {
			return { success: false, error: `Failed to remove collaborator: ${error.message}` }
		}

		return { success: true, error: null }
	} catch (error) {
		console.error("Error in removeCollaboratorAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Get all collaborators for a map
 */
export async function getCollaboratorsAction(
	mapId: string
): Promise<ActionResult<{ collaborators: CollaboratorWithUser[]; isOwner: boolean }>> {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		// Get map to check ownership
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			return { success: false, error: `Map not found: ${mapError.message}` }
		}

		const isOwner = user ? mapData.owner_id === user.id : false

		// Get collaborators
		const { data, error } = await supabase
			.from("map_collaborators")
			.select(
				`
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
			`
			)
			.eq("map_id", mapId)
			.order("joined_at", { ascending: true })

		if (error) {
			return { success: false, error: `Failed to fetch collaborators: ${error.message}` }
		}

		// Transform data
		const collaborators: CollaboratorWithUser[] = (data || []).map((collab: any) => ({
			id: collab.id,
			map_id: collab.map_id,
			user_id: collab.user_id,
			role: collab.role,
			joined_at: collab.joined_at,
			user: collab.users,
		}))

		return {
			success: true,
			error: null,
			data: { collaborators, isOwner },
		}
	} catch (error) {
		console.error("Error in getCollaboratorsAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
