"use client"

import { createClient } from "./api/supabaseClient"
import { Submission } from "@/lib/types/mapTypes"
import { toast } from "@/lib/hooks/use-toast"

export async function fetchPendingSubmissions(mapId: string) {
	const supabase = createClient()

	try {
		const { data, error } = await supabase
			.from("locations")
			.select(
				`
        id,
        map_id,
        name,
        google_maps_url,
        note,
        creator_id,
        status,
        users!locations_creator_id_fkey (
          first_name,
          last_name,
          picture_url
        )
      `
			)
			.eq("map_id", mapId)
			.eq("status", "pending")

		if (error) throw error

		return { data, error: null }
	} catch (error) {
		console.error("Error fetching pending submissions:", error)
		return { data: null, error }
	}
}

export async function approveLocation(locationId: string) {
	const supabase = createClient()

	try {
		const { data, error } = await supabase
			.from("locations")
			.update({
				is_approved: true,
				status: "approved",
			})
			.eq("id", locationId)
			.select("*, maps(name, slug, id)")
			.single()

		if (error) throw error

		// Send email notification to the submitter
		try {
			// Get submitter email
			const { data: submitterData } = await supabase
				.from("users")
				.select("email")
				.eq("id", data.creator_id)
				.single()

			if (submitterData && data.maps) {
				const submitterEmail = submitterData.email
				const mapTitle = data.maps.name
				const locationName = data.name
				const mapSlug = data.maps.slug || "map"

				// Use NEXT_PUBLIC_SITE_URL instead of NEXT_PUBLIC_APP_URL
				// Add proper fallbacks and logging to diagnose URL issues
				console.log("Environment variables in approveLocation:", {
					NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
					NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
				})

				const baseUrl =
					process.env.NEXT_PUBLIC_SITE_URL ||
					(typeof window !== "undefined"
						? window.location.origin
						: "https://bengalurumaps.com")

				console.log("Using baseUrl for email links:", baseUrl)

				const mapUrl = `${baseUrl}/maps/${mapSlug}/${data.maps.id}`

				console.log("Final mapUrl for approval email:", mapUrl)

				// Use the server-side API route to send the email
				console.log("Calling approval email API route...")

				// Create the email payload
				const emailPayload = {
					submitterEmail,
					mapTitle,
					locationName,
					mapUrl,
				}

				// Log the payload for debugging
				console.log("Email payload:", JSON.stringify(emailPayload))

				// Get the base URL from environment or use a default
				// In browser environments, use the current origin
				const emailApiUrl = `${baseUrl}/api/email/approve`

				console.log("Email API URL:", emailApiUrl)

				// Use a more robust fetch implementation
				try {
					// First, try using the fetch API
					const controller = new AbortController()
					const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

					console.log("Sending fetch request to approval email API...")
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
						throw new Error(`Email API error: ${response.status} ${errorText}`)
					}

					const emailResult = await response.json()
					console.log("Email API response:", emailResult)

					if (!emailResult.success) {
						console.error("Email sending failed:", emailResult.error)
					} else {
						console.log("Email sent successfully!")
					}
				} catch (fetchError) {
					console.error("Error calling approval email API:", fetchError)
					// Log the error but don't fail the location approval
				}
			}
		} catch (emailError) {
			// Log the error but don't fail the location approval
			console.error("Error sending approval notification email:", emailError)
			console.error(
				"Error details:",
				emailError instanceof Error ? emailError.message : emailError
			)
			if (emailError instanceof Error && emailError.stack) {
				console.error("Error stack:", emailError.stack)
			}
		}

		return { success: true, error: null }
	} catch (error) {
		console.error("Error approving location:", error)
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		}
	}
}

export async function rejectLocation(locationId: string) {
	const supabase = createClient()

	try {
		const { data, error } = await supabase
			.from("locations")
			.update({
				status: "rejected",
			})
			.eq("id", locationId)
			.select("*, maps(name, slug, id)")
			.single()

		if (error) throw error

		// Send email notification to the submitter
		try {
			// Get submitter email
			const { data: submitterData } = await supabase
				.from("users")
				.select("email")
				.eq("id", data.creator_id)
				.single()

			if (submitterData && data.maps) {
				const submitterEmail = submitterData.email
				const mapTitle = data.maps.name
				const locationName = data.name

				// Log environment variables for debugging
				console.log("Environment variables in rejectLocation:", {
					NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
					NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
				})

				// Use the server-side API route to send the email
				console.log("Calling rejection email API route...")

				// Get the base URL from environment or use a default
				const baseUrl =
					process.env.NEXT_PUBLIC_SITE_URL ||
					(typeof window !== "undefined"
						? window.location.origin
						: "https://bengalurumaps.com")

				// Create the email payload
				const emailPayload = {
					submitterEmail,
					mapTitle,
					locationName,
				}

				// Log the payload for debugging
				console.log("Email payload:", JSON.stringify(emailPayload))

				const emailApiUrl = `${baseUrl}/api/email/reject`

				console.log("Email API URL:", emailApiUrl)

				// Use a more robust fetch implementation
				try {
					// First, try using the fetch API
					const controller = new AbortController()
					const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

					console.log("Sending fetch request to rejection email API...")
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
						throw new Error(`Email API error: ${response.status} ${errorText}`)
					}

					const emailResult = await response.json()
					console.log("Email API response:", emailResult)

					if (!emailResult.success) {
						console.error("Email sending failed:", emailResult.error)
					} else {
						console.log("Email sent successfully!")
					}
				} catch (fetchError) {
					console.error("Error calling rejection email API:", fetchError)
					// Log the error but don't fail the location rejection
				}
			}
		} catch (emailError) {
			// Log the error but don't fail the location rejection
			console.error("Error sending rejection notification email:", emailError)
			console.error(
				"Error details:",
				emailError instanceof Error ? emailError.message : emailError
			)
			if (emailError instanceof Error && emailError.stack) {
				console.error("Error stack:", emailError.stack)
			}
		}

		return { success: true, data, error: null }
	} catch (error) {
		console.error("Error rejecting location:", error)
		return {
			success: false,
			data: null,
			error:
				error instanceof Error ? error.message : "An unexpected error occurred",
		}
	}
}
