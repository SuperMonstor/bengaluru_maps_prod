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

		// Use the modular uploadImage function from ImageProcessor
		// Pass the supabase client to ensure proper authentication
		const displayPictureUrl = await ImageProcessor.uploadImage(displayPicture, {
			serverSupabase: supabase,
		})
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

		// First, get the total count of maps for pagination
		const { count, error: countError } = await supabase
			.from("maps")
			.select("*", { count: "exact", head: true })

		if (countError) throw countError

		// Use a more efficient approach with a subquery to get maps sorted by upvotes
		// This SQL query will be executed on the database side
		const { data, error: mapsError } = await supabase.rpc(
			"get_maps_sorted_by_upvotes",
			{
				p_limit: limit,
				p_offset: from,
			}
		)

		if (mapsError) throw mapsError

		if (!data || data.length === 0) {
			return { data: [], total: count || 0, page, limit, error: null }
		}

		// Extract map IDs for additional queries
		const mapIds = data.map((map: any) => map.id)
		const mapsData = data as unknown as MapData[]

		// Get additional data needed for the response
		const [locationCountsRes, contributorCountsRes] = await Promise.all([
			supabase.rpc("get_location_counts", { map_ids: mapIds }),
			supabase.rpc("get_contributor_counts", { map_ids: mapIds }),
		])

		if (locationCountsRes.error) throw locationCountsRes.error
		if (contributorCountsRes.error) throw contributorCountsRes.error

		// Create maps for efficient lookups
		const locationCounts = new Map<string, number>(
			locationCountsRes.data?.map(
				(l: { map_id: string; location_count: number }) => [
					l.map_id,
					Number(l.location_count),
				]
			) || []
		)
		const contributorCounts = new Map<string, number>(
			contributorCountsRes.data?.map(
				(c: { map_id: string; contributor_count: number }) => [
					c.map_id,
					Number(c.contributor_count),
				]
			) || []
		)

		// Check if the current user has upvoted each map
		let hasUpvotedMap: Map<string, boolean> = new Map()

		if (userId) {
			const { data: userVotes, error: votesError } = await supabase
				.from("votes")
				.select("map_id")
				.eq("user_id", userId)
				.in("map_id", mapIds)

			if (votesError) throw votesError

			// Create a map of map_id to whether the user has upvoted it
			hasUpvotedMap = new Map(
				userVotes?.map((vote: { map_id: string }) => [vote.map_id, true]) || []
			)
		}

		// Create the response maps array
		const maps: MapResponse[] = mapsData.map((map) => ({
			id: map.id,
			title: map.name,
			description: map.short_description,
			image: map.display_picture || "/placeholder.svg",
			locations: locationCounts.get(map.id) ?? 0,
			contributors: contributorCounts.get(map.id) ?? 0,
			upvotes: map.vote_count || 0, // Use the vote_count from the RPC function
			hasUpvoted: hasUpvotedMap.get(map.id) || false,
			username: map.username || "Unknown User",
			userProfilePicture: map.user_picture || null,
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

		// Create a consistent data structure that includes both name and title properties
		return {
			data: {
				id: data.id,
				name: data.name, // Include the original name property
				title: data.name, // Map name to title for backward compatibility
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

		// If the creator is not the owner, send a notification email to the map owner
		if (!isOwner) {
			try {
				console.log(
					"Starting email notification process for non-owner submission"
				)

				// First, let's test if the email API is accessible at all
				try {
					console.log("Testing email API endpoint...")
					const testResponse = await fetch("/api/email/test", {
						method: "GET",
					})
					const testResult = await testResponse.json()
					console.log("Email API test response:", testResult)
				} catch (testError) {
					console.error("Error testing email API:", testError)
				}

				// Get map details
				console.log("Fetching map details for mapId:", mapId)
				const { data: mapData, error: mapDataError } = await supabase
					.from("maps")
					.select("name, owner_id")
					.eq("id", mapId)
					.single()

				if (mapDataError) {
					console.error("Error fetching map details:", mapDataError)
					throw new Error(
						`Failed to fetch map details: ${mapDataError.message}`
					)
				}
				console.log("Map details fetched:", mapData)

				// Get map owner details
				console.log("Fetching owner details for owner_id:", mapData?.owner_id)
				const { data: ownerData, error: ownerDataError } = await supabase
					.from("users")
					.select("email, first_name, last_name")
					.eq("id", mapData?.owner_id)
					.single()

				if (ownerDataError) {
					console.error("Error fetching owner details:", ownerDataError)
					throw new Error(
						`Failed to fetch owner details: ${ownerDataError.message}`
					)
				}
				console.log("Owner details fetched:", {
					email: ownerData?.email,
					name: `${ownerData?.first_name} ${ownerData?.last_name}`,
				})

				// Get submitter details
				console.log("Fetching submitter details for creator_id:", creatorId)
				const { data: submitterData, error: submitterDataError } =
					await supabase
						.from("users")
						.select("first_name, last_name")
						.eq("id", creatorId)
						.single()

				if (submitterDataError) {
					console.error("Error fetching submitter details:", submitterDataError)
					throw new Error(
						`Failed to fetch submitter details: ${submitterDataError.message}`
					)
				}
				console.log("Submitter details fetched:", {
					name: `${submitterData?.first_name} ${submitterData?.last_name}`,
				})

				if (mapData && ownerData && submitterData) {
					const ownerEmail = ownerData.email
					const mapTitle = mapData.name
					const submitterName = `${submitterData.first_name} ${submitterData.last_name}`

					// Fix the mapUrl to use NEXT_PUBLIC_SITE_URL instead of NEXT_PUBLIC_APP_URL
					// Add proper fallbacks and logging to diagnose URL issues
					console.log("Environment variables:", {
						NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
						NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
						windowOrigin:
							typeof window !== "undefined"
								? window.location.origin
								: "not available",
					})

					const baseUrl =
						process.env.NEXT_PUBLIC_SITE_URL ||
						(typeof window !== "undefined"
							? window.location.origin
							: "https://bengalurumaps.com")

					console.log("Using baseUrl for email links:", baseUrl)

					// Ensure mapUrl is properly constructed with the pending path
					const mapUrl = `${baseUrl}/my-maps/${mapId}/pending`

					console.log("Final mapUrl for email:", mapUrl)

					console.log("Preparing to send email with the following data:", {
						ownerEmail,
						mapTitle,
						locationName: name,
						submitterName,
						mapUrl,
						baseUrl: baseUrl,
					})

					// Use the server-side API route to send the email
					console.log("Calling email API route...")

					// Create the email payload
					const emailPayload = {
						ownerEmail,
						mapTitle,
						locationName: name,
						submitterName,
						mapUrl,
					}

					// Log the payload for debugging
					console.log("Email payload:", JSON.stringify(emailPayload))

					// Get the base URL from environment or use a default
					// In browser environments, use the current origin
					const emailApiUrl = `${baseUrl}/api/email`

					console.log("Email API URL:", emailApiUrl)

					// Use a more robust fetch implementation
					try {
						// First, try using the fetch API
						const controller = new AbortController()
						const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

						console.log("Sending fetch request to email API...")
						const response = await fetch(emailApiUrl, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(emailPayload),
							signal: controller.signal,
							// Add these options to ensure the request is sent properly
							credentials: "same-origin",
							mode: "cors",
							cache: "no-cache",
						})

						clearTimeout(timeoutId)

						console.log("Fetch response status:", response.status)

						if (!response.ok) {
							const errorText = await response.text()
							console.error(
								`Email API responded with status ${response.status}:`,
								errorText
							)
							throw new Error(
								`Email API error: ${response.status} ${errorText}`
							)
						}

						const emailResult = await response.json()
						console.log("Email API response:", emailResult)

						if (!emailResult.success) {
							console.error("Email sending failed:", emailResult.error)
						} else {
							console.log("Email sent successfully!")
						}
					} catch (fetchError) {
						console.error("Error calling email API:", fetchError)

						// Fallback: Try using XMLHttpRequest as a backup
						console.log("Trying fallback with XMLHttpRequest...")

						try {
							await new Promise((resolve, reject) => {
								const xhr = new XMLHttpRequest()
								xhr.open("POST", emailApiUrl)
								xhr.setRequestHeader("Content-Type", "application/json")
								xhr.timeout = 10000 // 10 second timeout

								xhr.onload = function () {
									if (xhr.status >= 200 && xhr.status < 300) {
										console.log("XHR response:", xhr.responseText)
										resolve(xhr.responseText)
									} else {
										console.error("XHR error response:", xhr.responseText)
										reject(
											new Error(`XHR error: ${xhr.status} ${xhr.statusText}`)
										)
									}
								}

								xhr.onerror = function () {
									console.error("XHR network error")
									reject(new Error("XHR network error"))
								}

								xhr.ontimeout = function () {
									console.error("XHR timeout")
									reject(new Error("XHR timeout"))
								}

								xhr.send(JSON.stringify(emailPayload))
							})

							console.log("Fallback email request completed")
						} catch (xhrError) {
							console.error("Fallback email request also failed:", xhrError)

							// Last resort: Log to console that we need to manually send an email
							console.warn("MANUAL EMAIL NEEDED:", {
								to: ownerEmail,
								subject: `New Location Submission: ${name}`,
								mapTitle,
								locationName: name,
								submitterName,
								mapUrl,
							})
						}
					}
				} else {
					console.error("Missing data required for email:", {
						mapData: !!mapData,
						ownerData: !!ownerData,
						submitterData: !!submitterData,
					})
				}
			} catch (emailError) {
				// Log the error but don't fail the location creation
				console.error(
					"Error sending submission notification email:",
					emailError
				)
				// Log the full error stack for debugging
				if (emailError instanceof Error) {
					console.error("Error stack:", emailError.stack)
				}
			}
		} else {
			console.log("No email notification sent - creator is the map owner")
		}

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

export async function deleteLocation(
	locationId: string,
	userId: string
): Promise<{ success: boolean; error: string | null }> {
	try {
		const supabase = createClient()

		// First, check if the user is authorized to delete this location
		// Get the location and its associated map
		const { data: location, error: locationError } = await supabase
			.from("locations")
			.select("id, map_id, creator_id")
			.eq("id", locationId)
			.single()

		if (locationError) {
			throw new Error(`Failed to find location: ${locationError.message}`)
		}

		// Get the map to check ownership
		const { data: map, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", location.map_id)
			.single()

		if (mapError) {
			throw new Error(`Failed to find map: ${mapError.message}`)
		}

		// Only allow deletion if user is the map owner or the location creator
		if (map.owner_id !== userId && location.creator_id !== userId) {
			throw new Error("You don't have permission to delete this location")
		}

		// Delete the location
		const { error: deleteError } = await supabase
			.from("locations")
			.delete()
			.eq("id", locationId)

		if (deleteError) {
			throw new Error(`Failed to delete location: ${deleteError.message}`)
		}

		return { success: true, error: null }
	} catch (error) {
		console.error("Error in deleteLocation:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}

export async function updateMap({
	mapId,
	title,
	shortDescription,
	body,
	displayPicture,
	userId,
}: {
	mapId: string
	title: string
	shortDescription: string
	body: string
	displayPicture?: File | null
	userId: string
}): Promise<CreateMapResult> {
	try {
		if (!mapId || !title || !shortDescription || !body || !userId) {
			throw new Error("Required fields are missing")
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

		// Only allow update if user is the map owner
		if (mapData.owner_id !== userId) {
			throw new Error("You don't have permission to edit this map")
		}

		// Prepare update data
		const updateData: any = {
			name: title,
			short_description: shortDescription,
			body,
			updated_at: new Date().toISOString(),
			slug: slugify(title),
		}

		// If a new image is provided, upload it
		if (displayPicture) {
			const displayPictureUrl = await ImageProcessor.uploadImage(
				displayPicture,
				{
					serverSupabase: supabase,
				}
			)
			updateData.display_picture = displayPictureUrl
		}

		// Update the map
		const { data, error } = await supabase
			.from("maps")
			.update(updateData)
			.eq("id", mapId)
			.select()
			.single()

		if (error) throw new Error(`Failed to update map: ${error.message}`)

		return { data, error: null }
	} catch (error) {
		console.error("Error in updateMap:", error)
		return {
			data: null,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
