"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function RouteTransition() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const [isNavigating, setIsNavigating] = useState(false)

	// Track route changes using a more reliable approach
	useEffect(() => {
		// Create a MutationObserver to watch for changes to the DOM
		// This is a more reliable way to detect navigation in Next.js
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "class"
				) {
					const target = mutation.target as HTMLElement
					if (target.classList.contains("nprogress-busy")) {
						setIsNavigating(true)
					} else if (target.classList.contains("nprogress-done")) {
						setTimeout(() => {
							setIsNavigating(false)
						}, 300)
					}
				}
			})
		})

		// Start observing the document body for attribute changes
		observer.observe(document.body, { attributes: true })

		// Add event listeners for clicks on links
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			const link = target.closest("a")

			if (
				link &&
				link.getAttribute("href") &&
				!link.getAttribute("href").startsWith("#")
			) {
				setIsNavigating(true)
			}
		}

		document.addEventListener("click", handleClick)

		// Clean up
		return () => {
			observer.disconnect()
			document.removeEventListener("click", handleClick)
		}
	}, [])

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
