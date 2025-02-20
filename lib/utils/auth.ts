// lib/utils/auth.ts
import { supabase } from "../supabaseClient"

export async function signInWithGoogle() {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${window.location.origin}/auth/callback`,
		},
	})

	if (error) {
		console.error("Error signing in with Google:", error.message)
		return { error }
	}

	console.log("SignInWithGoogle - Redirect data:", data)
	return { data, error: null }
}
