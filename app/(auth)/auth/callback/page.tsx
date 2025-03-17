"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/api/supabaseClient"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { Suspense } from "react"

// Client component that uses useSearchParams
function AuthCallbackContent() {
	const router = useRouter()
	const searchParams = useSearchParams()

	useEffect(() => {
		const handleAuth = async () => {
			const { data, error } = await createClient().auth.getSession()

			if (error || !data?.session) {
				console.error("Authentication failed:", error)
				router.replace("/login") // Redirect back to login if auth fails
			} else {
				const { success, error } = await updateUserInDatabase(data.session.user)
				if (!success) {
					console.error("User update failed: ", error)
				}
				router.replace("/") // Redirect to home on success
			}
		}

		handleAuth()
	}, [router])

	return <p>Signing in...</p>
}

// Main page component with Suspense boundary
export default function AuthCallback() {
	return (
		<Suspense fallback={<p>Loading...</p>}>
			<AuthCallbackContent />
		</Suspense>
	)
}
