"use server"

import { createClient } from "./supabaseServer"
import { slugify, generateUniqueSlug, validateSlug, isReservedSlug } from "@/lib/utils/slugify"
import { ImageProcessor } from "@/lib/utils/images"
import { toggleUpvote } from "../votesService"

export async function createMapAction(formData: FormData) {
	try {
		const supabase = await createClient()

		// Get the current user from server-side auth
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in to create a map" }
		}

		// Get form data
		const title = formData.get("title") as string
		const customSlug = formData.get("slug") as string
		const shortDescription = formData.get("shortDescription") as string
		const body = formData.get("body") as string
		const displayPicture = formData.get("displayPicture") as File | null

		if (!title || !shortDescription || !body || !displayPicture) {
			return { success: false, error: "All fields are required" }
		}

		// Upload image
		let displayPictureUrl: string
		try {
			displayPictureUrl = await ImageProcessor.uploadImage(displayPicture, {
				serverSupabase: supabase,
			})
		} catch (uploadError) {
			console.error("Image upload failed:", uploadError)
			return {
				success: false,
				error: `Failed to upload image: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
			}
		}

		// Handle slug generation/validation
		let slug: string
		if (customSlug) {
			slug = customSlug
			// Validate custom slug
			const validation = validateSlug(slug)
			if (!validation.valid) {
				return {
					success: false,
					error: validation.error || "Invalid slug",
				}
			}
			if (isReservedSlug(slug)) {
				return {
					success: false,
					error: "This URL is reserved. Please choose a different one.",
				}
			}
			// Check if slug already exists
			const { data: existingMap } = await supabase
				.from("maps")
				.select("slug")
				.eq("slug", slug)
				.single()
			if (existingMap) {
				return {
					success: false,
					error: "This URL is already taken. Please choose a different one.",
				}
			}
		} else {
			// Generate unique slug by checking database directly
			slug = await generateUniqueSlug(title, supabase)

			// Check if slug is reserved
			if (isReservedSlug(slug)) {
				return {
					success: false,
					error: "This title generates a reserved URL. Please choose a different title.",
				}
			}
		}

		// Insert the map - owner_id comes from authenticated user, not client input
		const { data, error } = await supabase
			.from("maps")
			.insert({
				name: title,
				short_description: shortDescription,
				body,
				display_picture: displayPictureUrl,
				owner_id: user.id, // Securely set from server-side auth
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				slug: slug,
				city: 'Bangalore',
			})
			.select()
			.single()

		if (error) {
			// Check if it's a unique constraint violation on slug
			if (error.code === '23505' && error.message.includes('slug')) {
				return {
					success: false,
					error: "This URL is already taken. Please try again or use a different custom URL.",
				}
			}
			return {
				success: false,
				error: `Failed to create map: ${error.message}`,
			}
		}

		// Auto-upvote the map for the creator using the votesService
		if (data) {
			try {
				const upvoteResult = await toggleUpvote(data.id, user.id, supabase)
				if (!upvoteResult.success) {
					console.error("Failed to auto-upvote map:", upvoteResult.error)
				}
			} catch (upvoteError) {
				console.error("Error auto-upvoting map:", upvoteError)
				// Continue even if upvote fails
			}
		}

		return {
			success: true,
			error: null,
			data: {
				id: data.id,
				slug: data.slug,
			},
		}
	} catch (error) {
		console.error("Error in createMapAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
