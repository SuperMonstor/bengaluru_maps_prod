"use server"

import { createClient } from "./supabaseServer"
import { ImageProcessor } from "@/lib/utils/images"

export async function updateProfileAction(formData: FormData) {
	try {
		const supabase = await createClient()

		// Get the current user
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return { success: false, error: "You must be logged in to update your profile" }
		}

		// Get form data
		const firstName = formData.get("firstName") as string
		const lastName = formData.get("lastName") as string
		const profilePicture = formData.get("profilePicture") as File | null

		// At least one field must be provided
		if (!firstName && !lastName && (!profilePicture || profilePicture.size === 0)) {
			return { success: false, error: "Please provide at least one field to update" }
		}

		// Prepare update data
		const updateData: any = {
			updated_at: new Date().toISOString(),
		}

		// Add optional fields if provided
		if (firstName) {
			updateData.first_name = firstName
		}
		if (lastName) {
			updateData.last_name = lastName
		}

		// Handle profile picture upload if provided
		if (profilePicture && profilePicture.size > 0) {
			try {
				const pictureUrl = await ImageProcessor.uploadImage(profilePicture, {
					bucket: "maps",
					folder: "user-profile-pictures",
					upsert: true,
					contentType: profilePicture.type || "image/jpeg",
					serverSupabase: supabase, // Pass the authenticated server-side client
				})

				updateData.picture_url = pictureUrl
			} catch (uploadError) {
				console.error("Profile picture upload error:", uploadError)
				return {
					success: false,
					error:
						uploadError instanceof Error
							? `Image upload failed: ${uploadError.message}`
							: "Failed to upload profile picture",
				}
			}
		}

		// Update the user profile
		const { data, error } = await supabase
			.from("users")
			.update(updateData)
			.eq("id", user.id)
			.select()
			.single()

		if (error) {
			return {
				success: false,
				error: `Failed to update profile: ${error.message}`,
			}
		}

		return {
			success: true,
			error: null,
			data: {
				id: data.id,
				firstName: data.first_name,
				lastName: data.last_name,
				pictureUrl: data.picture_url,
			},
		}
	} catch (error) {
		console.error("Error in updateProfileAction:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
