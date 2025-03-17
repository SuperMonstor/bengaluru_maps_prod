"use client"

import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"

// Separate client component for the not-found page
function NotFoundContent() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
			<h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
			<h2 className="text-2xl font-semibold text-gray-700 mb-6">
				Page Not Found
			</h2>
			<p className="text-gray-600 max-w-md mb-8">
				The page you are looking for doesn't exist or has been moved.
			</p>
			<Link href="/" prefetch={false}>
				<Button size="lg">Return Home</Button>
			</Link>
		</div>
	)
}

export default function NotFound() {
	return (
		<Suspense
			fallback={
				<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
					<h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
					<h2 className="text-2xl font-semibold text-gray-700 mb-6">
						Page Not Found
					</h2>
					<p className="text-gray-600 max-w-md mb-8">Loading...</p>
				</div>
			}
		>
			<NotFoundContent />
		</Suspense>
	)
}
