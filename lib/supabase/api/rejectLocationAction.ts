"use server"

import { createClient } from "./supabaseServer"
import { hasMapEditPermission } from "./permissionHelpers"

export async function rejectLocationAction(locationId: string) {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return {
				success: false,
				data: null,
				error: "You must be logged in to reject a location",
			}
		}

		// Fetch the location to get map_id for permission check
		const { data: location, error: locationError } = await supabase
			.from("locations")
			.select("id, map_id, creator_id")
			.eq("id", locationId)
			.single()

		if (locationError) {
			return {
				success: false,
				data: null,
				error: `Failed to find location: ${locationError.message}`,
			}
		}

		// Verify user has edit permission on the map
		const canEdit = await hasMapEditPermission(
			supabase,
			location.map_id,
			user.id
		)

		if (!canEdit) {
			return {
				success: false,
				data: null,
				error: "You don't have permission to reject locations on this map",
			}
		}

		const { data, error } = await supabase
			.from("locations")
			.update({
				status: "rejected",
			})
			.eq("id", locationId)
			.select("id, name, creator_id, maps(name, slug, id)")
			.single()

		if (error) throw error

		try {
			const { data: submitterData, error: submitterError } = await supabase
				.from("users")
				.select("email")
				.eq("id", data.creator_id)
				.single()

			if (submitterError) {
				console.error("Error fetching submitter email:", submitterError)
				} else if (submitterData?.email && data.maps) {
					const baseUrl =
						process.env.NEXT_PUBLIC_SITE_URL || "https://bengalurumaps.com"
					const map =
						Array.isArray(data.maps) ? data.maps[0] : data.maps

					await fetch(`${baseUrl}/api/email/reject`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-internal-secret": process.env.INTERNAL_API_SECRET || "",
						},
						body: JSON.stringify({
							submitterEmail: submitterData.email,
							mapTitle: map?.name || "Map",
							locationName: data.name,
						}),
					})
				}
		} catch (emailError) {
			console.error("Error sending rejection email:", emailError)
		}

		return { success: true, data, error: null }
	} catch (error) {
		console.error("Error rejecting location:", error)
		return {
			success: false,
			data: null,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
