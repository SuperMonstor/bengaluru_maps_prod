"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/api/supabaseClient"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { Suspense } from "react"

// Force this page to be dynamic, preventing static prerendering
export const dynamic = "force-dynamic"

// Client component that handles auth callback
function AuthCallbackContent() {
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()
	const isProcessingRef = useRef(false)

	useEffect(() => {
		// Prevent duplicate processing
		if (isProcessingRef.current) {
			return
		}
		isProcessingRef.current = true

		const handleAuth = async (): Promise<void> => {
			try {
				const supabase = createClient()

				// Get the code from the URL
				const url = new URL(window.location.href)
				const code = url.searchParams.get("code")

				if (code) {
					const { error: exchangeError } =
						await supabase.auth.exchangeCodeForSession(code)

					if (exchangeError) {
						throw new Error(`Code exchange failed: ${exchangeError.message}`)
					}
				}

				const { data, error: sessionError } = await supabase.auth.getSession()

				if (sessionError || !data?.session) {
					throw new Error(sessionError?.message || "No session found")
				}

				// Update user in database before redirecting
				await updateUserInDatabase(data.session.user)

				// Success - redirect home and let server re-fetch user data
				router.push("/")
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Unknown error"
				console.error("[AuthCallback] Auth failed:", errorMessage)
				setError(errorMessage)
			}
		}

		handleAuth()
	}, [router])

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-lg text-red-600">Authentication failed</p>
				<p className="text-sm text-gray-500">{error}</p>
				<button
					onClick={() => router.push("/")}
					className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
				>
					Return Home
				</button>
			</div>
		)
	}

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
