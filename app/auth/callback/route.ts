import { createClient } from "@/lib/supabase/api/supabaseServer"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { AUTH_REDIRECT_COOKIE } from "@/lib/utils/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get("code")
	const origin = requestUrl.origin

	// Check for redirect cookie (set before OAuth for invite flow, etc.)
	const redirectCookie = request.cookies.get(AUTH_REDIRECT_COOKIE)
	const redirectPath = redirectCookie?.value ? decodeURIComponent(redirectCookie.value) : null

	if (code) {
		const supabase = await createClient()

		// Exchange code for session - this sets the auth cookies
		const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

		if (exchangeError) {
			console.error("[AuthCallback] Code exchange failed:", exchangeError.message)
			// Redirect to home with error - user might already be authenticated
			const response = NextResponse.redirect(`${origin}/?error=auth_failed`)
			// Clear the redirect cookie on error
			response.cookies.delete(AUTH_REDIRECT_COOKIE)
			return response
		}

		// Get the session to verify and update user in database
		const { data: { session }, error: sessionError } = await supabase.auth.getSession()

		if (sessionError || !session) {
			console.error("[AuthCallback] No session after exchange:", sessionError?.message)
			const response = NextResponse.redirect(`${origin}/?error=no_session`)
			response.cookies.delete(AUTH_REDIRECT_COOKIE)
			return response
		}

		// Update user in database - don't fail auth if this fails
		// Pass the authenticated supabase client to ensure RLS works
		try {
			await updateUserInDatabase(session.user, supabase)
		} catch (updateError) {
			console.error("[AuthCallback] User update failed:", updateError)
			// Continue anyway - user is authenticated, DB sync can happen later
		}
	}

	// Determine redirect destination
	let redirectUrl = origin
	if (redirectPath) {
		// Validate that redirectPath is a relative path (security)
		if (redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
			redirectUrl = `${origin}${redirectPath}`
		}
	}

	// Create response and clear redirect cookie
	const response = NextResponse.redirect(redirectUrl)
	if (redirectCookie) {
		response.cookies.delete(AUTH_REDIRECT_COOKIE)
	}

	return response
}
