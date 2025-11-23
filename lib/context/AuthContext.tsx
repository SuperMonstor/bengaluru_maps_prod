"use client"

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	useCallback,
	ReactNode,
} from "react"
import { createClient } from "../supabase/api/supabaseClient"
import { UserSchema } from "../types/userTypes"

interface AuthContextValue {
	user: UserSchema | null
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
	const [user, setUser] = useState<UserSchema | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(true)

	// Track in-flight requests to prevent duplicate fetches
	const fetchingUserIdRef = useRef<string | null>(null)
	const initializedRef = useRef(false)

	// Memoize fetchUserData to prevent recreation on each render
	const fetchUserData = useCallback(
		async (supabase: ReturnType<typeof createClient>, authUserId: string | null) => {
			// Skip if we're already fetching this user
			if (fetchingUserIdRef.current === authUserId) {
				return
			}

			fetchingUserIdRef.current = authUserId

			if (!authUserId) {
				setUser(null)
				setIsLoading(false)
				fetchingUserIdRef.current = null
				return
			}

			try {
				const { data, error } = await supabase
					.from("users")
					.select("*")
					.eq("id", authUserId)
					.single()

				// Check if this request is still relevant
				if (fetchingUserIdRef.current !== authUserId) {
					return // A newer request has started, ignore this result
				}

				if (error) {
					console.error("[AuthContext] Error fetching user data:", error.message)
					setUser(null)
				} else {
					setUser(data as UserSchema)
				}
			} catch (err) {
				console.error("[AuthContext] Unexpected error fetching user:", err)
				setUser(null)
			} finally {
				if (fetchingUserIdRef.current === authUserId) {
					setIsLoading(false)
					fetchingUserIdRef.current = null
				}
			}
		},
		[]
	)

	useEffect(() => {
		// Prevent double initialization in React StrictMode
		if (initializedRef.current) {
			return
		}
		initializedRef.current = true

		const supabase = createClient()

		async function initAuth() {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession()

			if (error) {
				console.error("[AuthContext] Error getting session:", error.message)
				setUser(null)
				setIsLoading(false)
				return
			}

			await fetchUserData(supabase, session?.user?.id || null)
		}

		initAuth()

		// Set up auth state listener - only handles state changes after initial load
		const { data: authListener } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				// Skip INITIAL_SESSION as we handle it above
				if (event === "INITIAL_SESSION") {
					return
				}

				console.log("[AuthContext] Auth state changed:", event)
				await fetchUserData(supabase, session?.user?.id || null)
			}
		)

		return () => {
			authListener?.subscription?.unsubscribe()
		}
	}, [fetchUserData])

	const signOut = useCallback(async () => {
		const supabase = createClient()
		const { error } = await supabase.auth.signOut()
		if (error) {
			console.error("[AuthContext] Error signing out:", error.message)
		}
	}, [])

	const value: AuthContextValue = { user, isLoading, signOut }

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
