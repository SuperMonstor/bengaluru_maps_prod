import { createClient } from "./api/supabaseClient"

const supabase = createClient()

export interface VoteResult {
	success: boolean
	error?: string
	isUpvoted?: boolean
}

/**
 * Toggle upvote for a map
 * If the user has already upvoted, it will remove the upvote
 * If the user hasn't upvoted, it will add an upvote
 */
export async function toggleUpvote(
	mapId: string,
	userId: string
): Promise<VoteResult> {
	try {
		// Check if the user has already upvoted this map
		const { data: existingVote, error: checkError } = await supabase
			.from("votes")
			.select("id")
			.eq("map_id", mapId)
			.eq("user_id", userId)
			.single()

		if (checkError && checkError.code !== "PGRST116") {
			// PGRST116 is the error code for "no rows returned" which is expected if user hasn't voted
			console.error("Error checking existing vote:", checkError)
			return { success: false, error: "Failed to check existing vote" }
		}

		// If the user has already upvoted, remove the upvote
		if (existingVote) {
			const { error: deleteError } = await supabase
				.from("votes")
				.delete()
				.eq("id", existingVote.id)

			if (deleteError) {
				console.error("Error removing upvote:", deleteError)
				return { success: false, error: "Failed to remove upvote" }
			}

			return { success: true, isUpvoted: false }
		}

		// If the user hasn't upvoted, add an upvote
		const { error: insertError } = await supabase.from("votes").insert({
			map_id: mapId,
			user_id: userId,
		})

		if (insertError) {
			console.error("Error adding upvote:", insertError)
			return { success: false, error: "Failed to add upvote" }
		}

		return { success: true, isUpvoted: true }
	} catch (error) {
		console.error("Unexpected error in toggleUpvote:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

/**
 * Check if a user has upvoted a specific map
 */
export async function hasUserUpvoted(
	mapId: string,
	userId: string
): Promise<boolean> {
	try {
		const { data, error } = await supabase
			.from("votes")
			.select("id")
			.eq("map_id", mapId)
			.eq("user_id", userId)
			.single()

		if (error && error.code !== "PGRST116") {
			console.error("Error checking if user has upvoted:", error)
			return false
		}

		return !!data
	} catch (error) {
		console.error("Unexpected error in hasUserUpvoted:", error)
		return false
	}
}
