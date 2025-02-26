"use client"

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/service/client"
import { useAuth } from "@/lib/context/AuthContext"

interface PendingCountContextType {
	pendingCount: number
	refreshPendingCount: () => Promise<void>
	isLoading: boolean
}

const PendingCountContext = createContext<PendingCountContextType | undefined>(
	undefined
)

export function PendingCountProvider({ children }: { children: ReactNode }) {
	const { user, isLoading: authLoading } = useAuth()
	const [pendingCount, setPendingCount] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const supabase = createClient()

	const fetchPendingCount = async () => {
		if (!user || authLoading) {
			setPendingCount(0)
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		try {
			// Fetch all maps owned by the user
			const { data: maps, error: mapsError } = await supabase
				.from("maps")
				.select("id")
				.eq("owner_id", user.id)

			if (mapsError) {
				console.error("Error fetching maps:", mapsError)
				setPendingCount(0)
				setIsLoading(false)
				return
			}

			if (!maps.length) {
				setPendingCount(0)
				setIsLoading(false)
				return
			}

			const mapIds = maps.map((map) => map.id)

			// Fetch count of pending locations (not rejected)
			const { count, error: countError } = await supabase
				.from("locations")
				.select("id", { count: "exact" })
				.in("map_id", mapIds)
				.eq("status", "pending")

			if (countError) {
				console.error("Error fetching pending count:", countError)
				setPendingCount(0)
			} else {
				setPendingCount(count || 0)
			}
		} catch (error) {
			console.error("Unexpected error fetching pending count:", error)
			setPendingCount(0)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchPendingCount()
	}, [user, authLoading])

	const refreshPendingCount = async () => {
		await fetchPendingCount()
	}

	const value = {
		pendingCount,
		refreshPendingCount,
		isLoading,
	}

	return (
		<PendingCountContext.Provider value={value}>
			{children}
		</PendingCountContext.Provider>
	)
}

export function usePendingCount() {
	const context = useContext(PendingCountContext)
	if (context === undefined) {
		throw new Error(
			"usePendingCount must be used within a PendingCountProvider"
		)
	}
	return context
}
