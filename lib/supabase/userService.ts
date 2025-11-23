import { User } from "@supabase/supabase-js"
import { createClient } from "./api/supabaseClient"

interface UpdateUserResult {
	success: boolean
	error?: string
}

export async function updateUserInDatabase(
	user: User
): Promise<UpdateUserResult> {
	try {
		const supabase = createClient()

		// Parse name safely - handle missing or malformed full_name
		const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
		const nameParts = fullName.trim().split(/\s+/)
		const firstName = nameParts[0] || "User"
		const lastName = nameParts.slice(1).join(" ") || ""

		// Use upsert to handle race conditions - if user exists, update; if not, insert
		const { error: upsertError } = await supabase.from("users").upsert(
			{
				id: user.id,
				email: user.email!,
				first_name: firstName,
				last_name: lastName,
				picture_url: user.user_metadata?.avatar_url || null,
				updated_at: new Date().toISOString(),
			},
			{
				onConflict: "id",
				ignoreDuplicates: false, // Update on conflict
			}
		)

		if (upsertError) {
			throw new Error(`Failed to upsert user: ${upsertError.message}`)
		}

		return { success: true }
	} catch (error) {
		console.error("Error in updateUserInDatabase:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		}
	}
}
