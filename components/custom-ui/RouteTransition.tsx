"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

// Component that uses useSearchParams
function RouteTransitionContent() {
	const pathname = usePathname()
	const [isNavigating, setIsNavigating] = useState(false)
	const prevPathnameRef = useRef(pathname)

	useEffect(() => {
		// Only show loading indicator if the pathname has changed
		if (pathname !== prevPathnameRef.current) {
			setIsNavigating(true)
			prevPathnameRef.current = pathname

			// Hide the loading indicator after a short delay
			const timer = setTimeout(() => {
				setIsNavigating(false)
			}, 300)

			return () => clearTimeout(timer)
		}
	}, [pathname])

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
