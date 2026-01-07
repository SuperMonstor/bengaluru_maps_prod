"use client"

import { createContext, useContext, type ReactNode } from "react"
import { UserSchema } from "@/lib/types/userTypes"
import { PendingCountProvider } from "@/lib/context/PendingCountContext"
import { UserLocationProvider } from "@/lib/context/UserLocationContext"
import { RouteTransition } from "@/components/custom-ui/RouteTransition"
import { ProfileModalTrigger } from "@/components/auth/ProfileModalTrigger"
import Header from "@/components/custom-ui/Header"
import { Toaster } from "@/components/ui/toaster"

interface UserContextValue {
	user: UserSchema | null
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function useUser() {
	const context = useContext(UserContext)
	if (context === undefined) {
		throw new Error("useUser must be used within LayoutClient")
	}
	return context
}

interface LayoutClientProps {
	user: UserSchema | null
	children: ReactNode
}

/**
 * Client wrapper for the root layout.
 * Receives user data from the server and provides it via context.
 * No loading states or fetching logic - just passes data down.
 */
export function LayoutClient({ user, children }: LayoutClientProps) {
	return (
		<UserContext.Provider value={{ user }}>
			<UserLocationProvider>
				<PendingCountProvider>
					<RouteTransition />
					<ProfileModalTrigger />
					{/* Create a flex layout with header and main content */}
					<div className="flex flex-col h-full">
						<Header />
						<main className="flex-1 overflow-auto">{children}</main>
					</div>
				</PendingCountProvider>
				<Toaster />
			</UserLocationProvider>
		</UserContext.Provider>
	)
}
