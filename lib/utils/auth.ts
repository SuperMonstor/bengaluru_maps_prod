import { supabase } from "../supabaseClient"

export async function signInWithGoogle() {
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		})

		if (error) throw error

		return { data, error: null }
	} catch (error) {
		console.error("Error signing in with Google:", error)
		return { data: null, error }
	}
}