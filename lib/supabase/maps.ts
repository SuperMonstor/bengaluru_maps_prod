// lib/supabase/maps.ts
import { createClient } from "./service/client"
import { ImageProcessor, IMAGE_CONFIG } from "@/lib/utils/images"
import {
	Location,
	MapData,
	MapResponse,
	MapsResult,
	CreateMapResult,
	CreateLocationResult,
} from "@/lib/types/map" // Import from types folder
import { User } from "@/lib/types/user"

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
}: {
	title: string
	shortDescription: string
	body: string
	displayPicture: File
	ownerId: string
}): Promise<CreateMapResult> {
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
        ),
        locations (
          id,
          map_id,
          creator_id,
          name,
          latitude,
          longitude,
          google_maps_url,
          note,
          created_at,
          is_approved
        ),
        votes (
          id
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

		const [locationCountsRes, voteCountsRes, contributorCountsRes] =
			await Promise.all([
				supabase.rpc("get_location_counts", { map_ids: mapIds }),
				supabase.rpc("get_vote_counts", { map_ids: mapIds }),
				supabase.rpc("get_contributor_counts", { map_ids: mapIds }),
			])

		if (locationCountsRes.error) throw locationCountsRes.error
		if (voteCountsRes.error) throw voteCountsRes.error
		if (contributorCountsRes.error) throw contributorCountsRes.error

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

		const maps: MapResponse[] = mapsData.map((map) => {
			const user = map.users as unknown as User
			return {
				id: map.id,
				title: map.name,
				description: map.short_description,
				image: map.display_picture || "/placeholder.svg",
				locations: locationCounts.get(map.id) ?? 0,
				contributors: contributorCounts.get(map.id) ?? 0,
				upvotes: voteCounts.get(map.id) ?? 0,
				username: user
					? `${user.first_name || "Unnamed"} ${user.last_name || "User"}`.trim()
					: "Unknown User",
				userProfilePicture: user?.picture_url || null,
			}
		})

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
        users!maps_owner_id_fkey (
          id,
          first_name,
          last_name,
          picture_url
        ),
        locations (
          id,
          map_id,
          creator_id,
          name,
          latitude,
          longitude,
          google_maps_url,
          note,
          created_at,
          is_approved
        ),
        votes (
          id
        )
      `
			)
			.eq("id", mapId)
			.single()

		if (error) throw error

		const { data: contributorCountsRes, error: contributorError } =
			await supabase.rpc("get_contributor_counts", { map_ids: [data.id] })

		if (contributorError) throw contributorError

		const contributorCounts = new Map<string, number>(
			contributorCountsRes?.map(
				(c: { map_id: string; contributor_count: number }) => [
					c.map_id,
					Number(c.contributor_count),
				]
			) || []
		)

		const user = data.users as unknown as User

		return {
			data: {
				id: data.id,
				title: data.name,
				description: data.short_description,
				body: data.body,
				image: data.display_picture || "/placeholder.svg",
				locations: data.locations || [], // Now includes is_approved
				contributors: contributorCounts.get(data.id) ?? 0,
				upvotes: data.votes.length,
				username: user
					? `${user.first_name || "Unnamed"} ${user.last_name || "User"}`.trim()
					: "Unknown User",
				userProfilePicture: user?.picture_url || null,
			},
			error: null,
		}
	} catch (error) {
		console.error("Error in getMapById:", error)
		return {
			data: null,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

export async function createLocation({
	mapId,
	creatorId,
	location,
	description,
}: {
	mapId: string
	creatorId: string
	location: string
	description: string
}): Promise<CreateLocationResult> {
	try {
		let latitude: number = 0
		let longitude: number = 0
		let googleMapsUrl: string = ""
		let name: string = ""

		if (location.startsWith("http")) {
			try {
				const url = new URL(location)
				const pathParts = url.pathname.split("/")
				if (pathParts.includes("place") && url.hash) {
					const hashParams = new URLSearchParams(url.hash.slice(1))
					const coordsMatch =
						hashParams.get("q") || url.hash.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
					if (coordsMatch) {
						const coords =
							coordsMatch instanceof Array
								? coordsMatch.slice(1)
								: coordsMatch.split(",")
						latitude = parseFloat(coords[0])
						longitude = parseFloat(coords[1])
					} else {
						const placesService = new google.maps.places.PlacesService(
							document.createElement("div")
						)
						await new Promise((resolve) => {
							placesService.findPlaceFromQuery(
								{ query: location, fields: ["geometry", "name"] },
								(results, status) => {
									if (
										status === google.maps.places.PlacesServiceStatus.OK &&
										results &&
										results[0]?.geometry?.location
									) {
										latitude = results[0].geometry.location.lat()
										longitude = results[0].geometry.location.lng()
										name = results[0].name || ""
										googleMapsUrl = `https://www.google.com/maps/place/${encodeURIComponent(
											name.replace(/ /g, "+")
										)}/@${latitude},${longitude},15z`
									}
									resolve(null)
								}
							)
						})
					}
				}
			} catch (parseError) {
				console.error("Error parsing Google Maps URL:", parseError)
				throw new Error(
					"Invalid Google Maps URL format. Please ensure it’s a valid place URL."
				)
			}
		} else {
			const placesService = new google.maps.places.PlacesService(
				document.createElement("div")
			)
			await new Promise((resolve) => {
				placesService.findPlaceFromQuery(
					{ query: location, fields: ["geometry", "name", "place_id"] },
					(results, status) => {
						if (
							status === google.maps.places.PlacesServiceStatus.OK &&
							results &&
							results[0]?.geometry?.location
						) {
							latitude = results[0].geometry.location.lat()
							longitude = results[0].geometry.location.lng()
							name = results[0].name || location
							const placeId = results[0].place_id
							googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`
						} else {
							throw new Error(
								"Could not find location. Please check the location name or URL."
							)
						}
						resolve(null)
					}
				)
			})
		}

		if (
			isNaN(latitude) ||
			isNaN(longitude) ||
			latitude < -90 ||
			latitude > 90 ||
			longitude < -180 ||
			longitude > 180
		) {
			throw new Error(
				"Invalid latitude or longitude values derived from the location."
			)
		}

		const { data, error } = await supabase
			.from("locations")
			.insert({
				map_id: mapId,
				creator_id: creatorId,
				name,
				latitude,
				longitude,
				google_maps_url: googleMapsUrl,
				note: description,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				is_approved: false, // Default to unapproved
			})
			.select()
			.single()

		if (error) throw new Error(`Failed to create location: ${error.message}`)
		return { data, error: null }
	} catch (error) {
		console.error("Error in createLocation:", error)
		return {
			data: null,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
