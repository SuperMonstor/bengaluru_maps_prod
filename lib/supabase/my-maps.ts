import { createClient } from "./service/client"
import { getMapById } from "./maps"
import { UserMap } from "@/lib/types/map"

export async function fetchUserMaps(
	userId: string
): Promise<{ data: UserMap[]; error: any }> {
	const supabase = createClient()

	try {
		// First, get all maps owned by the user
		const { data: userMaps, error } = await supabase
			.from("maps")
			.select("id")
			.eq("owner_id", userId)

		if (error) {
			throw error
		}

		if (!userMaps.length) {
			return { data: [], error: null }
		}

		// Then, get detailed information for each map
		const mapsWithDetails = await Promise.all(
			userMaps.map(async (map) => {
				const { data: mapData, error: mapError } = await getMapById(map.id)

				if (mapError || !mapData) {
					console.error(`Error fetching map ${map.id}:`, mapError)
					return null
				}

				// Get pending submissions count
				const { count, error: countError } = await supabase
					.from("locations")
					.select("id", { count: "exact" })
					.eq("map_id", map.id)
					.eq("status", "pending")

				if (countError) {
					console.error(
						`Error fetching pending count for map ${map.id}:`,
						countError
					)
				}

				return {
					...mapData,
					pendingCount: count || 0,
				}
			})
		)

		// Filter out any null results from failed fetches
		return {
			data: mapsWithDetails.filter(Boolean) as UserMap[],
			error: null,
		}
	} catch (error) {
		console.error("Error fetching user maps:", error)
		return { data: [], error }
	}
}
