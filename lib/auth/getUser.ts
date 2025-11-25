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

	// Get the current session
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession()

	if (sessionError) {
		console.error("[getUser] Error getting session:", sessionError.message)
		return null
	}

	if (!session?.user?.id) {
		return null
	}

	// Fetch complete user profile from users table
	const { data, error } = await supabase
		.from("users")
		.select("*")
		.eq("id", session.user.id)
		.single()

	if (error) {
		console.error("[getUser] Error fetching user profile:", error.message)
		return null
	}

	return data as UserSchema
}

// Export the return type for convenience
export type GetUserResult = Awaited<ReturnType<typeof getUser>>
