import { User } from "@supabase/supabase-js"
import { createClient } from "./client"

interface UpdateUserResult {
	success: boolean
	error?: string
}
export async function updateUserInDatabase(
	user: User
): Promise<UpdateUserResult> {
	try {
		const supabase = createClient()

		const { data: existingUser, error: fetchError } = await supabase
			.from("users")
			.select("*")
			.eq("id", user.id)
			.single()

		if (fetchError && fetchError.code === "PGRST116") {
			const fullName = user.user_metadata?.full_name
			const [firstName, lastName = ""] = fullName.split(" ") // Split full_name into first and last
			// No user found
			const userData: UserSchema = {
				id: user.id,
				email: user.email!,
				first_name: firstName,
				last_name: lastName || "",
				picture_url: user.user_metadata?.avatar_url || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}

			const { error: insertError } = await supabase
				.from("users")
				.insert(userData)

			if (insertError) {
				throw new Error(`Failed to create user: ${insertError.message}`)
			}

			return { success: true }
		} else if (fetchError) {
			throw new Error(`Failed to check user existence: ${fetchError.message}`)
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
