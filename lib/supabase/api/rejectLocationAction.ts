"use server"

import { createClient } from "./supabaseServer"

export async function rejectLocationAction(locationId: string) {
	try {
		const supabase = await createClient()

		const { data, error } = await supabase
			.from("locations")
			.update({
				status: "rejected",
			})
			.eq("id", locationId)
			.select("id, name, creator_id, maps(name, slug, id)")
			.single()

		if (error) throw error

		try {
			const { data: submitterData, error: submitterError } = await supabase
				.from("users")
				.select("email")
				.eq("id", data.creator_id)
				.single()

			if (submitterError) {
				console.error("Error fetching submitter email:", submitterError)
			} else if (submitterData?.email && data.maps) {
				const baseUrl =
					process.env.NEXT_PUBLIC_SITE_URL || "https://bengalurumaps.com"

				await fetch(`${baseUrl}/api/email/reject`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						submitterEmail: submitterData.email,
						mapTitle: data.maps.name,
						locationName: data.name,
					}),
				})
			}
		} catch (emailError) {
			console.error("Error sending rejection email:", emailError)
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
