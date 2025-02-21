"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateUserInDatabase } from "@/lib/supabase/user-utils"

export default function AuthCallback() {
	const router = useRouter()

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
