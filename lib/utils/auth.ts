// lib/utils/auth.ts
import { createClient } from "../supabase/api/supabaseClient"
import { updateUserInDatabase } from "../supabase/userService"
import { LoginInput } from "../validations/auth"

// Cookie name for storing redirect URL after OAuth
export const AUTH_REDIRECT_COOKIE = "auth_redirect"

/**
 * Set a cookie to redirect after OAuth login
 * Call this before initiating OAuth
 */
export function setAuthRedirect(redirectPath: string) {
	// Store for 10 minutes - should be enough for OAuth flow
	document.cookie = `${AUTH_REDIRECT_COOKIE}=${encodeURIComponent(redirectPath)}; path=/; max-age=600; SameSite=Lax`
}

/**
 * Clear the auth redirect cookie
 */
export function clearAuthRedirect() {
	document.cookie = `${AUTH_REDIRECT_COOKIE}=; path=/; max-age=0`
}

export async function signInWithGoogle(redirectAfterLogin?: string) {
	const supabase = createClient()
	const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
		? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
		: "http://localhost:3000/auth/callback" // Fallback for local dev

	// If a redirect is specified, store it in a cookie before OAuth
	if (redirectAfterLogin) {
		setAuthRedirect(redirectAfterLogin)
	}

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: redirectUrl,
		},
	})

	if (error) {
		console.error("Error signing in with Google:", error.message)
		// Clear the redirect cookie on error
		if (redirectAfterLogin) {
			clearAuthRedirect()
		}
		return { error }
	}

	console.log("SignInWithGoogle - Redirect data:", data)
	return { data, error: null }
}

export async function signInWithPassword(data: LoginInput) {
	const supabase = createClient()
	const { data: authData, error: authError } =
		await supabase.auth.signInWithPassword({
			email: data.email,
			password: data.password,
		})

	if (authError) {
		console.error("Error signing in with password:", authError.message)
		return { error: authError }
	}

	const { success, error: updateError } = await updateUserInDatabase(
		authData.user,
		supabase
	)
	if (!success) {
		console.error("User update failed:", updateError)
		return { error: new Error(updateError) }
	}

	console.log("SignInWithPassword - Auth data:", authData)
	return { data: authData, error: null }
}
