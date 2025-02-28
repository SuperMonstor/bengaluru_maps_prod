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
		const { error } = await supabase
			.from("locations")
			.update({
				is_approved: true,
				status: "approved",
			})
			.eq("id", locationId)

		if (error) throw error

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
			.select()

		if (error) throw error

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
