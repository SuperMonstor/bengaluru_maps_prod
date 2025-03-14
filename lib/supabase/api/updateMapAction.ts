"use server"

import { createClient } from "./supabaseServer"
import { slugify } from "@/lib/utils/slugify"
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
		const shortDescription = formData.get("shortDescription") as string
		const body = formData.get("body") as string
		const displayPicture = formData.get("displayPicture") as File | null

		if (!mapId || !title || !shortDescription || !body) {
			return { success: false, error: "Required fields are missing" }
		}

		// Check if the user is the owner of the map
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id, display_picture")
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

		// Prepare update data
		const updateData: any = {
			name: title,
			short_description: shortDescription,
			body,
			updated_at: new Date().toISOString(),
			slug: slugify(title),
		}

		// If a new image is provided, upload it
		if (displayPicture && displayPicture.size > 0) {
			// Validate image
			const validation = ImageProcessor.validateImage(displayPicture)
			if (!validation.isValid) {
				return { success: false, error: validation.error }
			}

			// Compress image
			const compressedImage = await ImageProcessor.compressImage(displayPicture)
			if (compressedImage.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
				return {
					success: false,
					error: "Image too large after compression. Try a smaller image.",
				}
			}

			// Upload image
			const fileName = ImageProcessor.generateFileName(displayPicture.name)
			const { error: uploadError } = await supabase.storage
				.from("maps")
				.upload(`maps-display-pictures/${fileName}`, compressedImage, {
					contentType: "image/jpeg",
					cacheControl: "3600",
					upsert: true,
				})

			if (uploadError) {
				return {
					success: false,
					error: `Failed to upload image: ${uploadError.message}`,
				}
			}

			// Get public URL
			const {
				data: { publicUrl },
			} = supabase.storage
				.from("maps")
				.getPublicUrl(`maps-display-pictures/${fileName}`)

			updateData.display_picture = publicUrl
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
