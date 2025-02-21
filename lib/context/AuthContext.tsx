"use client"

import { createContext, useState, useEffect, ReactNode } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "../supabase/client"

interface AuthContextValue {
	user: User | null
	isLoading: boolean
	signOut: () => Promise<void>
}

interface AuthProviderProps {
	children: ReactNode
}

export const AuthContext = createContext<AuthContextValue | undefined>(
	undefined
)

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(true)

	useEffect(() => {
		async function getSession() {
			const {
				data: { session },
				error,
			} = await createClient().auth.getSession()
			if (error) {
				console.error("Error getting session:", error.message)
				setUser(null)
			} else {
				setUser(session?.user || null)
			}
			setIsLoading(false)
		}

		getSession()

		const { data: authListener } = createClient().auth.onAuthStateChange(
			(event, session) => {
				setUser(session?.user ?? null)
			}
		)

		return () => {
			authListener?.subscription?.unsubscribe()
		}
	}, [])

	const signOut = async () => {
		const { error } = await createClient().auth.signOut()
		if (error) {
			console.error("Error signing out:", error.message)
		}
	}

	const value: AuthContextValue = { user, isLoading, signOut }

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
