"use server"

import { createClient } from "./supabaseServer"
import { hasMapEditPermission } from "./permissionHelpers"

export async function approveLocationAction(locationId: string) {
	try {
		const supabase = await createClient()

		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return {
				success: false,
				error: "You must be logged in to approve a location",
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
				error: "You don't have permission to approve locations on this map",
			}
		}

		const { data, error } = await supabase
			.from("locations")
			.update({
				is_approved: true,
				status: "approved",
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
				const mapUrl = `${baseUrl}/maps/${data.maps.slug || "map"}`

				await fetch(`${baseUrl}/api/email/approve`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						submitterEmail: submitterData.email,
						mapTitle: data.maps.name,
						locationName: data.name,
						mapUrl,
					}),
				})
			}
		} catch (emailError) {
			console.error("Error sending approval email:", emailError)
		}

		return { success: true, error: null }
	} catch (error) {
		console.error("Error approving location:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		}
	}
}
