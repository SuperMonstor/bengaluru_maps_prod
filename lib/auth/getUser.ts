import "server-only"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { UserSchema } from "@/lib/types/userTypes"

/**
 * Server-only utility to fetch the authenticated user with full profile data.
 *
 * This eliminates client-side race conditions by fetching auth state synchronously
 * on the server. Should be called from Server Components or Server Actions.
 *
 * @returns Complete user object or null if not authenticated
 */
export async function getUser(): Promise<UserSchema | null> {
	const supabase = await createClient()

	// Use getUser() instead of getSession() for better security
	// This authenticates the data by contacting Supabase Auth server
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()

	if (authError) {
		console.error("[getUser] Error getting user:", authError.message)
		return null
	}

	if (!user?.id) {
		return null
	}

	// Fetch complete user profile from users table
	const { data, error } = await supabase
		.from("users")
		.select("*")
		.eq("id", user.id)
		.single()

	if (error) {
		console.error("[getUser] Error fetching user profile:", error.message)
		return null
	}

	return data as UserSchema
}

// Export the return type for convenience
export type GetUserResult = Awaited<ReturnType<typeof getUser>>
