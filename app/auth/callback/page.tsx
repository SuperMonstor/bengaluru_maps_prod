"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthCallback() {
	const router = useRouter()

	useEffect(() => {
		const handleAuth = async () => {
			const { data, error } = await supabase.auth.getSession()

			if (error || !data?.session) {
				console.error("Authentication failed:", error)
				router.replace("/login") // Redirect back to login if auth fails
			} else {
				router.replace("/") // Redirect to home on success
			}
		}

		handleAuth()
	}, [router])

	return <p>Signing in...</p>
}