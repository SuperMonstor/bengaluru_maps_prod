"use server"

import { createClient } from "./supabaseServer"

export async function getLocationDetailsAction(locationId: string) {
	try {
		const supabase = await createClient()

		// Get the current user from server-side auth
		const {
			data: { user },
		} = await supabase.auth.getUser()

		// Fetch location details
		const { data: location, error: locationError } = await supabase
			.from("locations")
			.select("*, maps(owner_id)")
			.eq("id", locationId)
			.single()

		if (locationError) {
			return {
				success: false,
				error: `Failed to fetch location: ${locationError.message}`,
				data: null,
			}
		}

		// Security check: Only show pending locations to map owner or creator
		const isOwner = user && location.maps?.owner_id === user.id
		const isCreator = user && location.creator_id === user.id

		if (location.status !== 'approved' && !isOwner && !isCreator) {
			return {
				success: false,
				error: 'This location is not yet approved',
				data: null,
			}
		}

		// Fetch upvote count
		const { data: voteCountData } = await supabase.rpc("get_location_vote_counts", {
			location_ids: [locationId],
		})

		const upvotes = voteCountData?.[0]?.vote_count ?? 0

		// Check if user has upvoted (only if logged in)
		let hasUpvoted = false
		if (user) {
			const { data: userVoteData } = await supabase
				.from("location_votes")
				.select("id")
				.eq("location_id", locationId)
				.eq("user_id", user.id)
				.single()

			hasUpvoted = !!userVoteData
		}

		return {
			success: true,
			error: null,
			data: {
				...location,
				upvotes,
				hasUpvoted,
			},
		}
	} catch (error) {
		console.error("Error in getLocationDetailsAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
			data: null,
		}
	}
}
