import { createClient } from "./api/supabaseClient"

const supabase = createClient()

export interface LocationVoteResult {
	success: boolean
	error?: string
	isUpvoted?: boolean
}

/**
 * Toggle upvote for a location
 * If the user has already upvoted, it will remove the upvote
 * If the user hasn't upvoted, it will add an upvote
 */
export async function toggleLocationUpvote(
	locationId: string,
	userId: string
): Promise<LocationVoteResult> {
	try {
		// Check if the user has already upvoted this location
		const { data: existingVote, error: checkError } = await supabase
			.from("location_votes")
			.select("id")
			.eq("location_id", locationId)
			.eq("user_id", userId)
			.single()

		if (checkError && checkError.code !== "PGRST116") {
			// PGRST116 is the error code for "no rows returned" which is expected if user hasn't voted
			console.error("Error checking existing location vote:", checkError)
			return { success: false, error: "Failed to check existing vote" }
		}

		// If the user has already upvoted, remove the upvote
		if (existingVote) {
			const { error: deleteError } = await supabase
				.from("location_votes")
				.delete()
				.eq("id", existingVote.id)

			if (deleteError) {
				console.error("Error removing location upvote:", deleteError)
				return { success: false, error: "Failed to remove upvote" }
			}

			return { success: true, isUpvoted: false }
		}

		// If the user hasn't upvoted, add an upvote
		const { error: insertError } = await supabase.from("location_votes").insert({
			location_id: locationId,
			user_id: userId,
		})

		if (insertError) {
			console.error("Error adding location upvote:", insertError)
			return { success: false, error: "Failed to add upvote" }
		}

		return { success: true, isUpvoted: true }
	} catch (error) {
		console.error("Unexpected error in toggleLocationUpvote:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Check if a user has upvoted a specific location
 */
export async function hasUserUpvotedLocation(
	locationId: string,
	userId: string
): Promise<boolean> {
	try {
		const { data, error } = await supabase
			.from("location_votes")
			.select("id")
			.eq("location_id", locationId)
			.eq("user_id", userId)
			.single()

		if (error && error.code !== "PGRST116") {
			console.error("Error checking if user has upvoted location:", error)
			return false
		}

		return !!data
	} catch (error) {
		console.error("Unexpected error in hasUserUpvotedLocation:", error)
		return false
	}
}
