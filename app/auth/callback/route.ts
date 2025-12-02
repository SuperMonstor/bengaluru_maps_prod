import { createClient } from "@/lib/supabase/api/supabaseServer"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get("code")
	const origin = requestUrl.origin

	if (code) {
		const supabase = await createClient()

		// Exchange code for session - this sets the auth cookies
		const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

		if (exchangeError) {
			console.error("[AuthCallback] Code exchange failed:", exchangeError.message)
			// Redirect to home with error - user might already be authenticated
			return NextResponse.redirect(`${origin}/?error=auth_failed`)
		}

		// Get the session to verify and update user in database
		const { data: { session }, error: sessionError } = await supabase.auth.getSession()

		if (sessionError || !session) {
			console.error("[AuthCallback] No session after exchange:", sessionError?.message)
			return NextResponse.redirect(`${origin}/?error=no_session`)
		}

		// Update user in database - don't fail auth if this fails
		try {
			await updateUserInDatabase(session.user)
		} catch (updateError) {
			console.error("[AuthCallback] User update failed:", updateError)
			// Continue anyway - user is authenticated, DB sync can happen later
		}
	}

	// Redirect to home page
	return NextResponse.redirect(origin)
}
