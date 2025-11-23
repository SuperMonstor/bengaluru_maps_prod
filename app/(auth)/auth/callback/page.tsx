"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/api/supabaseClient"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { Suspense } from "react"

// Force this page to be dynamic, preventing static prerendering
export const dynamic = "force-dynamic"

const AUTH_TIMEOUT_MS = 30000 // 30 second timeout
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// Helper to create a timeout promise
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
		),
	])
}

// Helper to delay execution
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// Client component that handles auth callback
function AuthCallbackContent() {
	const [error, setError] = useState<string | null>(null)
	const [retryCount, setRetryCount] = useState(0)
	const isProcessingRef = useRef(false)

	useEffect(() => {
		// Prevent duplicate processing
		if (isProcessingRef.current) {
			return
		}
		isProcessingRef.current = true

		const handleAuth = async (attempt: number = 0): Promise<void> => {
			try {
				const supabase = createClient()

				// Get the code from the URL
				const url = new URL(window.location.href)
				const code = url.searchParams.get("code")

				if (code) {
					const { error: exchangeError } = await withTimeout(
						supabase.auth.exchangeCodeForSession(code),
						AUTH_TIMEOUT_MS,
						"Code exchange"
					)

					if (exchangeError) {
						throw new Error(`Code exchange failed: ${exchangeError.message}`)
					}
				}

				const { data, error: sessionError } = await withTimeout(
					supabase.auth.getSession(),
					AUTH_TIMEOUT_MS,
					"Session retrieval"
				)

				if (sessionError || !data?.session) {
					throw new Error(sessionError?.message || "No session found")
				}

				// Update user in database - don't fail auth if this fails
				const { success, error: updateError } = await withTimeout(
					updateUserInDatabase(data.session.user),
					AUTH_TIMEOUT_MS,
					"User database update"
				)

				if (!success) {
					console.error("[AuthCallback] User update failed:", updateError)
					// Continue anyway - user is authenticated, DB sync can happen later
				}

				// Success - redirect home
				window.location.href = "/"
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Unknown error"
				console.error(`[AuthCallback] Attempt ${attempt + 1} failed:`, errorMessage)

				// Retry on transient failures
				if (attempt < MAX_RETRIES) {
					setRetryCount(attempt + 1)
					await delay(RETRY_DELAY_MS * (attempt + 1)) // Exponential backoff
					return handleAuth(attempt + 1)
				}

				// Max retries exceeded
				setError(errorMessage)
			}
		}

		handleAuth()
	}, [])

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-lg text-red-600">Authentication failed</p>
				<p className="text-sm text-gray-500">{error}</p>
				<button
					onClick={() => (window.location.href = "/login")}
					className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
				>
					Return to Login
				</button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh]">
			<p className="text-lg">
				{retryCount > 0 ? `Retrying... (attempt ${retryCount + 1})` : "Signing in..."}
			</p>
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
