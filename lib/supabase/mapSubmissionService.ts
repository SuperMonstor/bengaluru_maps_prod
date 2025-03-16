import { createClient } from "./api/supabaseClient"
import { Submission } from "@/lib/types/mapTypes"
import { toast } from "@/lib/hooks/use-toast"

export async function fetchPendingSubmissions(mapId: string) {
	const supabase = createClient()

	try {
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

		if (error) throw error

		return { data, error: null }
	} catch (error) {
		console.error("Error fetching pending submissions:", error)
		return { data: null, error }
	}
}

export async function approveLocation(locationId: string) {
	const supabase = createClient()

	try {
		const { data, error } = await supabase
			.from("locations")
			.update({
				is_approved: true,
				status: "approved",
			})
			.eq("id", locationId)
			.select("*, maps(title, slug, id)")
			.single()

		if (error) throw error

		// Send email notification to the submitter
		try {
			// Import the email service dynamically to avoid server/client mismatch issues
			const { sendApprovalNotification } = await import(
				"../services/emailService"
			)

			// Get submitter email
			const { data: submitterData } = await supabase
				.from("users")
				.select("email")
				.eq("id", data.creator_id)
				.single()

			if (submitterData && data.maps) {
				const submitterEmail = submitterData.email
				const mapTitle = data.maps.title
				const locationName = data.name
				const mapSlug = data.maps.slug || "map"
				const mapUrl = `${process.env.NEXT_PUBLIC_APP_URL}/maps/${mapSlug}/${data.maps.id}`

				// Send email notification
				await sendApprovalNotification(
					submitterEmail,
					mapTitle,
					locationName,
					mapUrl
				)
			}
		} catch (emailError) {
			// Log the error but don't fail the location approval
			console.error("Error sending approval notification email:", emailError)
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

export async function rejectLocation(locationId: string) {
	const supabase = createClient()

	try {
		const { data, error } = await supabase
			.from("locations")
			.update({
				status: "rejected",
			})
			.eq("id", locationId)
			.select("*, maps(title, slug, id)")
			.single()

		if (error) throw error

		// Send email notification to the submitter
		try {
			// Import the email service dynamically to avoid server/client mismatch issues
			const { sendRejectionNotification } = await import(
				"../services/emailService"
			)

			// Get submitter email
			const { data: submitterData } = await supabase
				.from("users")
				.select("email")
				.eq("id", data.creator_id)
				.single()

			if (submitterData && data.maps) {
				const submitterEmail = submitterData.email
				const mapTitle = data.maps.title
				const locationName = data.name

				// Send email notification
				await sendRejectionNotification(submitterEmail, mapTitle, locationName)
			}
		} catch (emailError) {
			// Log the error but don't fail the location rejection
			console.error("Error sending rejection notification email:", emailError)
		}

		return { success: true, data, error: null }
	} catch (error) {
		console.error("Error rejecting location:", error)
		return {
			success: false,
			data: null,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		}
	}
}
