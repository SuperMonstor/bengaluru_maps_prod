import { createClient } from "./service/client"
import { ImageProcessor, IMAGE_CONFIG } from "@/lib/utils/images"

const supabase = createClient()

export async function createMap({
	title,
	shortDescription,
	body,
	displayPicture,
	ownerId,
}: MapSchema) {
	try {
		let displayPictureUrl = null

		// Upload image if provided
		if (displayPicture) {
			// Validate image
			const validation = ImageProcessor.validateImage(displayPicture)
			if (!validation.isValid) {
				throw new Error(validation.error)
			}

			// Compress image
			const compressedImage = await ImageProcessor.compressImage(displayPicture)

			// Check compressed size
			if (compressedImage.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
				throw new Error(
					"Image is still too large after compression. Please try a smaller image."
				)
			}

			const fileName = ImageProcessor.generateFileName(displayPicture.name)

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("maps")
				.upload(`maps-display-pictures/${fileName}`, compressedImage, {
					contentType: "image/jpeg",
					cacheControl: "3600",
				})

			if (uploadError) {
				throw new Error(`Failed to upload image: ${uploadError.message}`)
			}

			const {
				data: { publicUrl },
			} = supabase.storage
				.from("maps")
				.getPublicUrl(`maps-display-pictures/${fileName}`)

			displayPictureUrl = publicUrl
		}

		// Create map record
		const { data, error } = await supabase
			.from("maps")
			.insert({
				name: title,
				short_description: shortDescription,
				body: body,
				display_picture: displayPictureUrl,
				owner_id: ownerId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to create map: ${error.message}`)
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
