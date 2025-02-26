"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { createClient } from "@/lib/supabase/service/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { getMapById } from "@/lib/supabase/maps"

interface Map {
	id: string
	name: string
	short_description: string
	image: string
	pending_submissions: number
}

export default function MyMapsPage() {
	const { user } = useAuth()
	const [maps, setMaps] = useState<Map[]>([])
	const [loading, setLoading] = useState(true)
	const supabase = createClient()

	useEffect(() => {
		if (!user) return

		const fetchMaps = async () => {
			const { data, error } = await supabase
				.from("maps")
				.select("id, name, short_description")
				.eq("owner_id", user.id)

			if (error) {
				console.error("Error fetching maps:", error)
				setLoading(false)
				return
			}

			const mapsWithDetails = await Promise.all(
				data.map(async (map) => {
					const { data: mapData, error: mapError } = await getMapById(map.id)
					if (mapError || !mapData) {
						console.error(`Error fetching map ${map.id}:`, mapError)
						return { ...map, image: "/placeholder.svg", pending_submissions: 0 }
					}

					const { count } = await supabase
						.from("locations")
						.select("id", { count: "exact" })
						.eq("map_id", map.id)
						.eq("is_approved", false)

					return {
						id: map.id,
						name: map.name,
						short_description: map.short_description,
						image: mapData.image,
						pending_submissions: count || 0,
					}
				})
			)

			setMaps(mapsWithDetails)
			setLoading(false)
		}

		fetchMaps()
	}, [user])

	if (!user) {
		return (
			<main className="bg-gray-50/50 flex flex-col min-h-screen">
				<div className="container mx-auto px-4 py-8">
					Please log in to view your maps.
				</div>
			</main>
		)
	}

	if (loading) {
		return (
			<main className="bg-gray-50/50 flex flex-col min-h-screen">
				<div className="container mx-auto px-4 py-8">Loading...</div>
			</main>
		)
	}

	return (
		<main className="bg-gray-50/50 flex flex-col min-h-screen">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-h1 font-bold text-foreground mb-6">My Maps</h1>
				<div className="grid gap-6">
					{maps.map((mapItem) => (
						<Link href={`/my-maps/${mapItem.id}/pending`} key={mapItem.id}>
							<Card className="cursor-pointer hover:shadow-lg transition-shadow">
								<CardHeader>
									<CardTitle className="text-h4 flex items-center justify-between">
										{mapItem.name}
										{mapItem.pending_submissions > 0 && (
											<span className="inline-flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full px-2 py-1">
												{mapItem.pending_submissions}{" "}
												{mapItem.pending_submissions === 1
													? "pending"
													: "pending"}
											</span>
										)}
									</CardTitle>
								</CardHeader>
								<CardContent className="flex items-center gap-4">
									<Image
										src={mapItem.image}
										alt={mapItem.name}
										width={100}
										height={100}
										className="w-24 h-24 object-cover rounded-md"
									/>
									<p className="text-body flex-1">
										{mapItem.short_description}
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</main>
	)
}
