// lib/supabase/maps.ts
import { createClient } from "./service/client"
import { ImageProcessor, IMAGE_CONFIG } from "@/lib/utils/images"

const supabase = createClient()

// Utility to handle errors for getMaps
const handleMapsError = (
	error: unknown,
	page: number,
	limit: number
): MapsResult => {
	console.error("Supabase Error:", error)
	return {
		data: [],
		total: 0,
		page,
		limit,
		error:
			error instanceof Error ? error.message : "An unexpected error occurred",
	}
}

// Interfaces
interface MapSchema {
	title: string
	shortDescription: string
	body: string
	displayPicture: File
	ownerId: string
}

interface User {
	id: string
	first_name: string | null
	last_name: string | null
	picture_url: string | null
}

interface MapData {
	id: string
	name: string
	short_description: string
	display_picture: string | null
	owner_id: string
	created_at: string
	users: User
}

interface MapResponse {
	id: string
	title: string
	description: string
	image: string
	locations: number
	contributors: number
	upvotes: number
	username: string
	userProfilePicture: string | null
}

interface MapsResult {
	data: MapResponse[]
	total: number
	page: number
	limit: number
	error: string | null
}

interface CreateMapResult {
	data: any // Adjust based on what Supabase returns
	error: string | null
}

async function uploadImage(file: File): Promise<string> {
	const validation = ImageProcessor.validateImage(file)
	if (!validation.isValid) throw new Error(validation.error)

	const compressedImage = await ImageProcessor.compressImage(file)
	if (compressedImage.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
		throw new Error("Image too large after compression. Try a smaller image.")
	}

	const fileName = ImageProcessor.generateFileName(file.name)
	const { error: uploadError } = await supabase.storage
		.from("maps")
		.upload(`maps-display-pictures/${fileName}`, compressedImage, {
			contentType: "image/jpeg",
			cacheControl: "3600",
		})

	if (uploadError)
		throw new Error(`Failed to upload image: ${uploadError.message}`)

	const {
		data: { publicUrl },
	} = supabase.storage
		.from("maps")
		.getPublicUrl(`maps-display-pictures/${fileName}`)

	return publicUrl
}

// Simplified createMap with its own error handling
export async function createMap({
	title,
	shortDescription,
	body,
	displayPicture,
	ownerId,
}: MapSchema): Promise<CreateMapResult> {
	try {
		if (!title || !shortDescription || !body || !displayPicture || !ownerId) {
			throw new Error("All fields are required")
		}

		const displayPictureUrl = await uploadImage(displayPicture)

		const { data, error } = await supabase
			.from("maps")
			.insert({
				name: title,
				short_description: shortDescription,
				body,
				display_picture: displayPictureUrl,
				owner_id: ownerId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.select()
			.single()

		if (error) throw new Error(`Failed to create map: ${error.message}`)
		return { data, error: null }
	} catch (error) {
		console.error("Error in createMap:", error)
		return {
			data: null,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

export async function getMaps(page = 1, limit = 10): Promise<MapsResult> {
	try {
		const from = (page - 1) * limit
		const to = from + limit - 1

		// Fetch maps with pagination and related user data
		const {
			data,
			error: mapsError,
			count,
		} = await supabase
			.from("maps")
			.select(
				`
        id,
        name,
        short_description,
        display_picture,
        owner_id,
        created_at,
        users!maps_owner_id_fkey (
          id,
          first_name,
          last_name,
          picture_url
        )
      `,
				{ count: "exact" }
			)
			.order("created_at", { ascending: false })
			.range(from, to)

		if (mapsError) throw mapsError

		const mapsData = (data as unknown as MapData[]) || []
		if (!mapsData.length) {
			return { data: [], total: count || 0, page, limit, error: null }
		}

		const mapIds = mapsData.map((map) => map.id)

		// Use RPC to get grouped counts for locations, votes, and distinct contributors
		const [locationCountsRes, voteCountsRes, contributorCountsRes] =
			await Promise.all([
				supabase.rpc("get_location_counts", { map_ids: mapIds }),
				supabase.rpc("get_vote_counts", { map_ids: mapIds }),
				supabase.rpc("get_contributor_counts", { map_ids: mapIds }), // Added for distinct contributors
			])

		if (locationCountsRes.error) throw locationCountsRes.error
		if (voteCountsRes.error) throw voteCountsRes.error
		if (contributorCountsRes.error) throw contributorCountsRes.error

		// Explicitly type the Map values as number
		const locationCounts = new Map<string, number>(
			locationCountsRes.data?.map(
				(l: { map_id: string; location_count: number }) => [
					l.map_id,
					Number(l.location_count),
				]
			) || []
		)
		const voteCounts = new Map<string, number>(
			voteCountsRes.data?.map((v: { map_id: string; vote_count: number }) => [
				v.map_id,
				Number(v.vote_count),
			]) || []
		)
		const contributorCounts = new Map<string, number>(
			contributorCountsRes.data?.map(
				(c: { map_id: string; contributor_count: number }) => [
					c.map_id,
					Number(c.contributor_count),
				]
			) || []
		)

		// Transform maps data into the desired response format
		const maps: MapResponse[] = mapsData.map((map) => ({
			id: map.id,
			title: map.name,
			description: map.short_description,
			image: map.display_picture || "/placeholder.svg",
			locations: locationCounts.get(map.id) ?? 0,
			contributors: contributorCounts.get(map.id) ?? 0, // Now uses distinct contributor count
			upvotes: voteCounts.get(map.id) ?? 0,
			username: map.users
				? `${map.users.first_name || "Unnamed"} ${
						map.users.last_name || "User"
				  }`.trim()
				: "Unknown User",
			userProfilePicture: map.users?.picture_url || null,
		}))

		return { data: maps, total: count || 0, page, limit, error: null }
	} catch (error) {
		return handleMapsError(error, page, limit)
	}
}

export async function getMapById(mapId: string) {
  try {
    const { data, error } = await supabase
      .from("maps")
      .select(
        `
        id,
        name,
        short_description,
        body,
        display_picture,
        owner_id,
        created_at,
        users (
          id,
          first_name,
          last_name,
          picture_url
        ),
        locations (
          id,
          name,
          coordinates,
          note,
          created_at
        ),
        votes (
          id
        )
      `
      )
      .eq("id", mapId)
      .single();

    if (error) throw error;

    console.log("Raw map data:", JSON.stringify(data, null, 2)); // Debug log to verify users data

    // Fetch distinct contributors using RPC
    const { data: contributorCountsRes, error: contributorError } = await supabase.rpc(
      "get_contributor_counts",
      { map_ids: [data.id] }
    );

    if (contributorError) throw contributorError;

    const contributorCounts = new Map<string, number>(
      contributorCountsRes?.map((c: { map_id: string; contributor_count: number }) => [
        c.map_id,
        Number(c.contributor_count),
      ]) || []
    );

    const user = data.users as unknown as User;

    return {
      data: {
        id: data.id,
        title: data.name,
        description: data.short_description,
        body: data.body,
        image: data.display_picture || "/placeholder.svg",
        locations: data.locations.length,
        contributors: contributorCounts.get(data.id) ?? 0,
        upvotes: data.votes.length,
        username: user
          ? `${user.first_name || "Unnamed"} ${user.last_name || "User"}`.trim()
          : "Unknown User",
        userProfilePicture: user?.picture_url || null,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in getMapById:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}