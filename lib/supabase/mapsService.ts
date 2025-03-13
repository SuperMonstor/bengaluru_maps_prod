import { createClient } from "./api/supabaseClient"
import { ImageProcessor, IMAGE_CONFIG } from "@/lib/utils/images"
import {
	Location,
	MapData,
	MapResponse,
	MapsResult,
	CreateMapResult,
	CreateLocationResult,
} from "@/lib/types/mapTypes"
import { User } from "@/lib/types/userTypes"
import { toggleUpvote } from "./votesService"
import { slugify } from "@/lib/utils/slugify"

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
		const slug = slugify(title)

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
				slug: slug,
			})
			.select()
			.single()

		if (error) throw new Error(`Failed to create map: ${error.message}`)

		// Auto-upvote the map for the creator using the votesService
		if (data) {
			try {
				// Use the existing toggleUpvote function from votesService
				const upvoteResult = await toggleUpvote(data.id, ownerId)
				if (!upvoteResult.success) {
					console.error("Failed to auto-upvote map:", upvoteResult.error)
				} else {
					// Ensure the upvote is reflected in the database
					await supabase.rpc("get_vote_counts", { map_ids: [data.id] })
				}
			} catch (upvoteError) {
				console.error("Error auto-upvoting map:", upvoteError)
				// Continue even if upvote fails
			}
		}

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

export async function getMaps(
	page = 1,
	limit = 10,
	userId?: string
): Promise<MapsResult> {
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
          id
        ),
        votes (
          user_id
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

		const hasUpvoted = userId
			? mapsData.map((map) => map.votes.some((vote) => vote.user_id === userId))
			: Array(mapsData.length).fill(false)

		const maps: MapResponse[] = mapsData.map((map) => ({
			id: map.id,
			title: map.name,
			description: map.short_description,
			image: map.display_picture || "/placeholder.svg",
			locations: locationCounts.get(map.id) ?? 0,
			contributors: contributorCounts.get(map.id) ?? 0,
			upvotes: voteCounts.get(map.id) ?? 0,
			hasUpvoted: hasUpvoted[mapsData.indexOf(map)],
			username: (map.users as unknown as User)
				? `${(map.users as unknown as User).first_name || "Unnamed"} ${
						(map.users as unknown as User).last_name || "User"
				  }`.trim()
				: "Unknown User",
			userProfilePicture: (map.users as unknown as User)?.picture_url || null,
			owner_id: map.owner_id,
			slug: slugify(map.name),
		}))

		return { data: maps, total: count || 0, page, limit, error: null }
	} catch (error) {
		return handleMapsError(error, page, limit)
	}
}

export async function getMapById(mapId: string, userId?: string) {
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
          id,
          user_id
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
		const hasUpvoted = userId
			? data.votes.some((vote) => vote.user_id === userId)
			: false

		return {
			data: {
				id: data.id,
				title: data.name,
				description: data.short_description,
				body: data.body,
				image: data.display_picture || "/placeholder.svg",
				locations: data.locations || [],
				contributors: contributorCounts.get(data.id) ?? 0,
				upvotes: data.votes.length,
				username: user
					? `${user.first_name || "Unnamed"} ${user.last_name || "User"}`.trim()
					: "Unknown User",
				userProfilePicture: user?.picture_url || null,
				owner_id: data.owner_id,
				hasUpvoted,
				slug: slugify(data.name),
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
	place_id,
	address,
	geometry,
}: {
	mapId: string
	creatorId: string
	location: string
	description: string
	place_id?: string
	address?: string | null
	geometry?: google.maps.LatLngLiteral
}): Promise<CreateLocationResult> {
	try {
		let latitude: number = 0
		let longitude: number = 0
		let googleMapsUrl: string = ""
		let name: string = ""
		// We'll still capture these values but won't store them until the schema is updated
		let placeId: string | null = place_id || null
		let locationAddress: string | null = address || null

		// If we already have geometry from the selected location, use it
		if (geometry) {
			latitude = geometry.lat
			longitude = geometry.lng
			name = location

			// If we have place_id, construct a Google Maps URL
			if (placeId) {
				googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
					name
				)}&query_place_id=${placeId}`
			} else {
				googleMapsUrl = `https://www.google.com/maps/place/${encodeURIComponent(
					name
				)}/@${latitude},${longitude},17z`
			}
		}
		// Otherwise, process the location string as before
		else if (location.startsWith("http")) {
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
				}
			}
			name = location
			googleMapsUrl = location
		} else {
			const placesService = new google.maps.places.PlacesService(
				document.createElement("div")
			)
			await new Promise((resolve) => {
				placesService.findPlaceFromQuery(
					{
						query: location,
						fields: ["geometry", "name", "place_id", "formatted_address"],
					},
					(results, status) => {
						if (
							status === google.maps.places.PlacesServiceStatus.OK &&
							results &&
							results[0]?.geometry?.location
						) {
							latitude = results[0].geometry.location.lat()
							longitude = results[0].geometry.location.lng()
							name = results[0].name || location
							placeId = placeId || results[0].place_id || null
							locationAddress =
								locationAddress || results[0].formatted_address || null
							googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
								name
							)}&query_place_id=${results[0].place_id}`
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

		// Modified duplicate detection that works with existing schema
		// Check for duplicate based on name and URL
		const { data: existingLocationsByName, error: checkNameError } =
			await supabase
				.from("locations")
				.select("id, name, google_maps_url, latitude, longitude")
				.eq("map_id", mapId)
				.eq("name", name)
				.limit(1)

		if (checkNameError) {
			throw new Error(
				`Error checking for duplicate by name: ${checkNameError.message}`
			)
		}

		// Check for duplicate based on URL
		const { data: existingLocationsByUrl, error: checkUrlError } =
			await supabase
				.from("locations")
				.select("id, name, google_maps_url")
				.eq("map_id", mapId)
				.eq("google_maps_url", googleMapsUrl)
				.limit(1)

		if (checkUrlError) {
			throw new Error(
				`Error checking for duplicate by URL: ${checkUrlError.message}`
			)
		}

		// Only consider it a duplicate if:
		// 1. Same Google Maps URL (exact same place), or
		// 2. Same name AND coordinates are very close (within 1 meter)
		const isDuplicate =
			existingLocationsByUrl?.length > 0 ||
			(existingLocationsByName?.length > 0 &&
				existingLocationsByName.some(
					(loc) =>
						Math.abs(loc.latitude - latitude) < 0.00001 &&
						Math.abs(loc.longitude - longitude) < 0.00001
				))

		if (isDuplicate) {
			throw new Error(
				`This exact location (${name}) has already been added to this map.`
			)
		}

		// Check if the user is the owner of the map
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			throw new Error(`Error checking map ownership: ${mapError.message}`)
		}

		// Auto-approve if the creator is the map owner
		const isOwner = mapData.owner_id === creatorId

		// Insert without place_id and address fields since they don't exist in the schema yet
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
				is_approved: isOwner, // Auto-approve if the creator is the map owner
				status: isOwner ? "approved" : "pending",
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
