"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/api/supabaseClient"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { Suspense } from "react"

// Force this page to be dynamic, preventing static prerendering
export const dynamic = "force-dynamic"

// Client component that handles auth callback
function AuthCallbackContent() {
	useEffect(() => {
		const handleAuth = async () => {
			console.log("[AuthCallback] Starting auth handling...")
			const supabase = createClient()

			// Get the code from the URL
			const url = new URL(window.location.href)
			const code = url.searchParams.get("code")

			if (code) {
				console.log("[AuthCallback] Exchanging code for session...")
				const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
				if (exchangeError) {
					console.error("[AuthCallback] Code exchange failed:", exchangeError.message)
					window.location.href = "/login"
					return
				}
				console.log("[AuthCallback] Code exchange successful")
			}

			console.log("[AuthCallback] Getting session...")
			const { data, error } = await supabase.auth.getSession()
			console.log("[AuthCallback] Session result:", { hasSession: !!data?.session, error: error?.message })

			if (error || !data?.session) {
				console.error(
					"Authentication failed:",
					error?.message || "No session found"
				)
				window.location.href = "/login"
				return
			}

			console.log("[AuthCallback] Updating user in database...")
			const { success, error: updateError } = await updateUserInDatabase(
				data.session.user
			)
			console.log("[AuthCallback] Update result:", { success, error: updateError })

			if (!success) {
				console.error("User update failed:", updateError)
			}

			console.log("[AuthCallback] Redirecting to home...")
			// Full page reload to ensure AuthContext re-initializes with fresh state
			window.location.href = "/"
		}

		handleAuth().catch((err) => {
			console.error("Error in auth handling:", err)
			window.location.href = "/login"
		})
	}, [])

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh]">
			<p className="text-lg">Signing in...</p>
		</div>
	)
}

// Main page component with Suspense boundary
export default function AuthCallback() {
	return (
		<div className="container mx-auto">
			<Suspense
				fallback={
					<div className="flex flex-col items-center justify-center min-h-[50vh]">
						<p className="text-lg">Loading authentication...</p>
					</div>
				}
			>
				<AuthCallbackContent />
			</Suspense>
		</div>
	)
}
