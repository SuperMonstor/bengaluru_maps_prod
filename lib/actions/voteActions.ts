"use server"

import { createClient } from "@/lib/supabase/api/supabaseClient"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function getUserUpvoteStatus(mapIds: string[]) {
	const cookieStore = cookies()

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get: async (name: string) => {
					const cookies = await cookieStore
					return cookies.get(name)?.value
				},
				set: async (name: string, value: string, options: any) => {
					const cookies = await cookieStore
					cookies.set({ name, value, ...options })
				},
				remove: async (name: string, options: any) => {
					const cookies = await cookieStore
					cookies.delete(name)
				},
			},
		}
	)

	// Get the current user
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		// Return an object with all mapIds set to false if user is not logged in
		return mapIds.reduce((acc, mapId) => {
			acc[mapId] = false
			return acc
		}, {} as Record<string, boolean>)
	}

	// Get all votes for the current user for the specified maps
	const { data: votes, error } = await supabase
		.from("votes")
		.select("map_id")
		.eq("user_id", user.id)
		.in("map_id", mapIds)

	if (error) {
		console.error("Error fetching user votes:", error)
		return mapIds.reduce((acc, mapId) => {
			acc[mapId] = false
			return acc
		}, {} as Record<string, boolean>)
	}

	// Create a map of mapId -> hasUpvoted
	const upvoteStatus = mapIds.reduce((acc, mapId) => {
		acc[mapId] = votes?.some((vote) => vote.map_id === mapId) || false
		return acc
	}, {} as Record<string, boolean>)

	return upvoteStatus
}
