"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"

// Component that uses useSearchParams
function RouteTransitionContent() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const [isNavigating, setIsNavigating] = useState(false)

	useEffect(() => {
		const handleStart = () => {
			// Only show loading indicator for internal navigation
			if (window.location.href.startsWith(window.location.origin)) {
				setIsNavigating(true)
			}
		}

		const handleStop = () => {
			setIsNavigating(false)
		}

		window.addEventListener("beforeunload", handleStart)
		window.addEventListener("unload", handleStop)

		return () => {
			window.removeEventListener("beforeunload", handleStart)
			window.removeEventListener("unload", handleStop)
		}
	}, [pathname])

	// Reset navigation state when route changes
	useEffect(() => {
		// When the route actually changes, we can be sure navigation is complete
		setTimeout(() => {
			setIsNavigating(false)
		}, 300)
	}, [pathname, searchParams])

	// Create a simple progress bar
	return (
		<div
			className={`fixed top-0 left-0 right-0 z-50 h-1 bg-primary-50 transition-opacity duration-300 ${
				isNavigating ? "opacity-100" : "opacity-0"
			}`}
		>
			<div className="h-full bg-primary animate-progress origin-left"></div>
		</div>
	)
}

// Export the component with a Suspense boundary
export function RouteTransition() {
	return (
		<Suspense
			fallback={
				<div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary-50 transition-opacity duration-300 opacity-0">
					<div className="h-full bg-primary animate-progress origin-left"></div>
				</div>
			}
		>
			<RouteTransitionContent />
		</Suspense>
	)
}
