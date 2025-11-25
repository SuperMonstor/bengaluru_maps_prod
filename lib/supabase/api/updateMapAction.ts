"use server"

import { createClient } from "./supabaseServer"
import { slugify, validateSlug, isReservedSlug } from "@/lib/utils/slugify"
import { ImageProcessor, IMAGE_CONFIG } from "@/lib/utils/images"

export async function updateMapAction(formData: FormData) {
	try {
		const supabase = await createClient()

		// Get the current user
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in to update a map" }
		}

		// Get form data
		const mapId = formData.get("mapId") as string
		const title = formData.get("title") as string
		const customSlug = formData.get("slug") as string
		const shortDescription = formData.get("shortDescription") as string
		const body = formData.get("body") as string
		const displayPicture = formData.get("displayPicture") as File | null

		if (!mapId || !title || !customSlug || !shortDescription || !body) {
			return { success: false, error: "Required fields are missing" }
		}

		// Check if the user is the owner of the map
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id, display_picture, slug")
			.eq("id", mapId)
			.single()

		if (mapError) {
			return {
				success: false,
				error: `Error checking map ownership: ${mapError.message}`,
			}
		}

		// Only allow update if user is the map owner
		if (mapData.owner_id !== user.id) {
			return {
				success: false,
				error: "You don't have permission to edit this map",
			}
		}

		// Use custom slug if provided and changed
		let newSlug = mapData.slug

		if (customSlug !== mapData.slug) {
			// Validate custom slug
			const validation = validateSlug(customSlug)
			if (!validation.valid) {
				return {
					success: false,
					error: validation.error || "Invalid URL slug",
				}
			}

			// Check if new slug is reserved
			if (isReservedSlug(customSlug)) {
				return {
					success: false,
					error: "This URL is reserved. Please choose a different one.",
				}
			}

			// Check if slug already exists
			const { data: existingMap } = await supabase
				.from("maps")
				.select("slug")
				.eq("slug", customSlug)
				.neq("id", mapId)
				.single()

			if (existingMap) {
				return {
					success: false,
					error: "This URL is already taken. Please choose a different one.",
				}
			}

			newSlug = customSlug
		}

		// Prepare update data
		const updateData: any = {
			name: title,
			short_description: shortDescription,
			body,
			updated_at: new Date().toISOString(),
			slug: newSlug,
		}

		// If a new image is provided, upload it
		if (displayPicture && displayPicture.size > 0) {
			try {
				console.log(
					"Uploading image:",
					displayPicture.name,
					displayPicture.type,
					displayPicture.size
				)

				// Use the modular uploadImage function from ImageProcessor
				// Pass the server-side Supabase client to ensure proper authentication
				const displayPictureUrl = await ImageProcessor.uploadImage(
					displayPicture,
					{
						upsert: true,
						// Explicitly set content type based on the file
						contentType: displayPicture.type || "image/jpeg",
						serverSupabase: supabase, // Pass the authenticated server-side client
					}
				)

				updateData.display_picture = displayPictureUrl
				console.log("Image uploaded successfully:", displayPictureUrl)
			} catch (uploadError) {
				console.error("Image upload error:", uploadError)
				return {
					success: false,
					error:
						uploadError instanceof Error
							? `Image upload failed: ${uploadError.message}`
							: "Failed to upload image",
				}
			}
		}

		// Update the map
		const { data, error } = await supabase
			.from("maps")
			.update(updateData)
			.eq("id", mapId)
			.select()
			.single()

		if (error) {
			return { success: false, error: `Failed to update map: ${error.message}` }
		}

		return {
			success: true,
			error: null,
			data: {
				id: data.id,
				title: data.name,
				slug: slugify(data.name),
			},
		}
	} catch (error) {
		console.error("Error in updateMapAction:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
