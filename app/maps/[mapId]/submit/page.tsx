"use client"

import { getMapById } from "@/lib/supabase/maps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { useAuth } from "@/lib/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"

interface SubmitLocationProps {
	params: Promise<{ mapId: string }> // Explicitly type params as a Promise
}

export default function SubmitLocationPage({ params }: SubmitLocationProps) {
	// Unwrap params using React.use()
	const resolvedParams = use(params)
	const mapId = resolvedParams.mapId

	const { user, isLoading } = useAuth()
	const router = useRouter()
	const [map, setMap] = useState<any>(null) // State to hold map data
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchMap() {
			try {
				const result = await getMapById(mapId)
				if (result.error || !result.data) {
					setError(result.error || "Map not found")
				} else {
					setMap(result.data)
				}
			} catch (err) {
				setError("An unexpected error occurred while fetching the map.")
				console.error("Error fetching map:", err)
			}
		}

		fetchMap()
	}, [mapId])

	if (isLoading) {
		return <div>Loading...</div>
	}

	if (!user) {
		router.push("/login")
		return null
	}

	if (error) {
		return (
			<main className="min-h-[calc(100vh-4rem)] p-4 bg-white">
				<div className="container mx-auto px-4 py-8">
					<p className="text-red-500">{error}</p>
				</div>
			</main>
		)
	}

	if (!map) {
		return <div>Loading map data...</div>
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] p-4 bg-white">
			<section className="max-w-2xl mx-auto space-y-8">
				<header>
					<h1 className="text-2xl font-bold text-gray-900">
						Submit to Community
					</h1>
				</header>

				<div className="flex flex-col md:flex-row gap-4 items-start">
					{/* Map Image (Left, 1/3 width on desktop, full width on mobile) */}
					<div className="relative w-full md:w-1/3 aspect-[16/9] overflow-hidden rounded-lg border border-gray-300">
						<Image
							src={map.image}
							alt={`${map.title} Preview`}
							fill
							className="object-cover"
						/>
					</div>

					{/* Title and Description (Right, 2/3 width on desktop, full width on mobile) */}
					<div className="w-full md:w-2/3 space-y-2">
						<h2 className="text-xl font-semibold text-gray-800">{map.title}</h2>
						<p className="text-md text-gray-600">{map.description}</p>
					</div>
				</div>

				<form className="space-y-6">
					<div className="space-y-2">
						<label
							htmlFor="googleMapsUrl"
							className="text-sm font-medium text-gray-700"
						>
							Google Maps URL *
						</label>
						<Input
							id="googleMapsUrl"
							type="text"
							placeholder="e.g., goo.gl/sdkljghalsdf or https://maps.google.com/?q=12.9716,77.5946"
							className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
							disabled
						/>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="description"
							className="text-sm font-medium text-gray-700"
						>
							Description about the place
						</label>
						<Textarea
							id="description"
							placeholder="Great sushi, awesome vibes"
							className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 h-24"
							disabled
						/>
					</div>

					<Button
						type="button"
						className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-2"
						disabled
					>
						Submit
					</Button>
				</form>
			</section>
		</main>
	)
}
