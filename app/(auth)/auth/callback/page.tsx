"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/api/supabaseClient"
import { updateUserInDatabase } from "@/lib/supabase/userService"
import { Suspense } from "react"

// Force this page to be dynamic, preventing static prerendering
export const dynamic = "force-dynamic"
export const runtime = "edge"

// Client component that uses useSearchParams
function AuthCallbackContent() {
	const router = useRouter()
	const searchParams = useSearchParams()

	useEffect(() => {
		const handleAuth = async () => {
			const supabase = createClient()
			const { data, error } = await supabase.auth.getSession()

			if (error || !data?.session) {
				console.error(
					"Authentication failed:",
					error?.message || "No session found"
				)
				router.replace("/login")
				return
			}

			const { success, error: updateError } = await updateUserInDatabase(
				data.session.user
			)
			if (!success) {
				console.error("User update failed:", updateError)
			}

			router.replace("/")
		}

		handleAuth().catch((err) => {
			console.error("Error in auth handling:", err)
			router.replace("/login")
		})
	}, [router])

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
