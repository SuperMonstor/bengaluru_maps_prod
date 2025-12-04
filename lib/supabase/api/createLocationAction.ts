"use server"

import { createClient } from "./supabaseServer"
import { toggleLocationUpvoteAction } from "./toggleLocationUpvoteAction"

export async function createLocationAction(formData: FormData) {
	try {
		const supabase = await createClient()

		// Get the current user from server-side auth
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in to submit a location" }
		}

		// Get form data
		const mapId = formData.get("mapId") as string
		const location = formData.get("location") as string
		const description = formData.get("description") as string | null
		const place_id = formData.get("place_id") as string | null
		const address = formData.get("address") as string | null
		const geometryLat = formData.get("geometryLat") as string | null
		const geometryLng = formData.get("geometryLng") as string | null

		if (!mapId || !location) {
			return { success: false, error: "Map ID and location are required" }
		}

		// Parse geometry if provided
		let geometry: google.maps.LatLngLiteral | undefined
		if (geometryLat && geometryLng) {
			geometry = {
				lat: parseFloat(geometryLat),
				lng: parseFloat(geometryLng),
			}
		}

		let latitude: number = 0
		let longitude: number = 0
		let googleMapsUrl: string = ""
		let name: string = ""
		let placeId: string | null = place_id
		let locationAddress: string | null = address

		// If we have geometry from the selected location, use it
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
		} else {
			// Fallback: location string without geometry
			name = location
			googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
		}

		if (
			geometry &&
			(isNaN(latitude) ||
				isNaN(longitude) ||
				latitude < -90 ||
				latitude > 90 ||
				longitude < -180 ||
				longitude > 180)
		) {
			return {
				success: false,
				error: "Invalid latitude or longitude values",
			}
		}

		// Check for duplicate based on name and URL
		const { data: existingLocationsByName, error: checkNameError } =
			await supabase
				.from("locations")
				.select("id, name, google_maps_url, latitude, longitude")
				.eq("map_id", mapId)
				.eq("name", name)
				.limit(1)

		if (checkNameError) {
			return {
				success: false,
				error: `Error checking for duplicate: ${checkNameError.message}`,
			}
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
			return {
				success: false,
				error: `Error checking for duplicate: ${checkUrlError.message}`,
			}
		}

		// Only consider it a duplicate if:
		// 1. Same Google Maps URL (exact same place), or
		// 2. Same name AND coordinates are very close (within 1 meter)
		const isDuplicate =
			existingLocationsByUrl?.length > 0 ||
			(existingLocationsByName?.length > 0 &&
				geometry &&
				existingLocationsByName.some(
					(loc) =>
						Math.abs(loc.latitude - latitude) < 0.00001 &&
						Math.abs(loc.longitude - longitude) < 0.00001
				))

		if (isDuplicate) {
			return {
				success: false,
				error: `This exact location (${name}) has already been added to this map.`,
			}
		}

		// Check if the user is the owner of the map
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
			.single()

		if (mapError) {
			return {
				success: false,
				error: `Error checking map ownership: ${mapError.message}`,
			}
		}

		// Auto-approve if the creator is the map owner
		const isOwner = mapData.owner_id === user.id

		// Insert the location - creator_id comes from authenticated user
		const { data, error } = await supabase
			.from("locations")
			.insert({
				map_id: mapId,
				creator_id: user.id, // Securely set from server-side auth
				name,
				latitude: geometry ? latitude : 0,
				longitude: geometry ? longitude : 0,
				google_maps_url: googleMapsUrl,
				note: description || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				is_approved: isOwner,
				status: isOwner ? "approved" : "pending",
				city: 'Bangalore',
			})
			.select()
			.single()

		if (error) {
			return {
				success: false,
				error: `Failed to create location: ${error.message}`,
			}
		}

		// Auto-upvote the location for the creator
		if (data) {
			try {
				const upvoteResult = await toggleLocationUpvoteAction(data.id)
				if (!upvoteResult.success) {
					console.error("Failed to auto-upvote location:", upvoteResult.error)
				}
			} catch (upvoteError) {
				console.error("Error auto-upvoting location:", upvoteError)
				// Continue even if upvote fails
			}
		}

		return {
			success: true,
			error: null,
			data: {
				id: data.id,
				isOwner,
			},
		}
	} catch (error) {
		console.error("Error in createLocationAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
