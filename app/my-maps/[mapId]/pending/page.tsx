"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { createClient } from "@/lib/supabase/service/client"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Check, X, MapPin } from "lucide-react"
import { getMapById } from "@/lib/supabase/maps"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLoadScript } from "@react-google-maps/api"

interface Submission {
	id: string
	map_id: string
	name: string
	google_maps_url: string
	note: string | null
	image_url: string | null
	rating: number | null
}

export default function PendingSubmissionsPage({
	params,
}: {
	params: Promise<{ mapId: string }>
}) {
	const { user } = useAuth()
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [mapName, setMapName] = useState<string>("")
	const [loading, setLoading] = useState(true)
	const supabase = createClient()

	const { isLoaded } = useLoadScript({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
		libraries: ["places"],
	})

	// Unwrap params with React.use()
	const { mapId } = React.use(params)

	useEffect(() => {
		if (!user || !isLoaded) return

		const fetchMapAndSubmissions = async () => {
			console.log("Fetching map and submissions for mapId:", mapId)

			// Fetch map name
			const { data: mapData, error: mapError } = await getMapById(mapId)
			if (mapError || !mapData) {
				console.error("Error fetching map:", mapError)
				setMapName("Unknown Map")
			} else {
				setMapName(mapData.title)
			}

			// Fetch pending submissions
			const { data, error } = await supabase
				.from("locations")
				.select("id, map_id, name, google_maps_url, note")
				.eq("map_id", mapId)
				.eq("is_approved", false)

			if (error) {
				console.error("Error fetching submissions:", error)
				setLoading(false)
				return
			}

			console.log("Submissions fetched:", data)

			// Fetch images, ratings from Google Places API
			const dummyElement = document.createElement("div")
			const placesService = new google.maps.places.PlacesService(dummyElement)
			const submissionsWithDetails = await Promise.all(
				data.map(async (submission) => {
					const placeIdMatch =
						submission.google_maps_url.match(/place_id:([^&]+)/)
					let imageUrl: string | null = null
					let rating: number | null = null

					if (placeIdMatch) {
						const placeId = placeIdMatch[1]
						const details =
							await new Promise<google.maps.places.PlaceResult | null>(
								(resolve) => {
									placesService.getDetails(
										{ placeId, fields: ["photos", "rating"] },
										(place, status) => {
											console.log(
												`Place ${submission.name} status:`,
												status,
												place
											)
											resolve(
												status === google.maps.places.PlacesServiceStatus.OK
													? place
													: null
											)
										}
									)
								}
							)

						if (details) {
							imageUrl =
								details.photos?.[0]?.getUrl({
									maxWidth: 100,
									maxHeight: 100,
								}) || null
							rating = details.rating || null
						}
					}

					return { ...submission, image_url: imageUrl, rating }
				})
			)

			console.log("Submissions with details:", submissionsWithDetails)
			setSubmissions(submissionsWithDetails)
			setLoading(false)
		}

		fetchMapAndSubmissions()
	}, [user, isLoaded, mapId])

	const handleApprove = async (submissionId: string) => {
		const { error } = await supabase
			.from("locations")
			.update({ is_approved: true })
			.eq("id", submissionId)

		if (error) {
			console.error("Error approving submission:", error)
			return
		}

		setSubmissions(submissions.filter((sub) => sub.id !== submissionId))
	}

	const handleReject = async (submissionId: string) => {
		const { error } = await supabase
			.from("locations")
			.delete()
			.eq("id", submissionId)

		if (error) {
			console.error("Error rejecting submission:", error)
			return
		}

		setSubmissions(submissions.filter((sub) => sub.id !== submissionId))
	}

	if (!user) {
		return (
			<main className="bg-gray-50/50 flex flex-col min-h-screen">
				<div className="container mx-auto px-4 py-8">
					Please log in to view pending submissions.
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
				<h1 className="text-h1 font-bold text-foreground mb-6">
					Pending Submissions for {mapName}
				</h1>
				{submissions.length === 0 ? (
					<p className="text-body text-muted-foreground">
						No pending submissions.
					</p>
				) : (
					<div className="grid gap-4">
						{submissions.map((submission) => (
							<Card key={submission.id}>
								<CardContent className="flex items-center gap-4 p-4">
									{submission.image_url ? (
										<Image
											src={submission.image_url}
											alt={submission.name}
											width={100}
											height={100}
											className="w-24 h-24 object-cover rounded-md"
										/>
									) : (
										<div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-caption text-muted-foreground">
											No Image
										</div>
									)}
									<div className="flex-1">
										<h3 className="text-h5 font-semibold text-foreground mb-2">
											{submission.name}
										</h3>
										<p className="text-body-sm text-muted-foreground mb-2">
											{submission.note || "No description"}
										</p>
										{submission.rating && (
											<p className="text-body-sm text-muted-foreground mb-2">
												Rating: {submission.rating}/5
											</p>
										)}
										<Link
											href={submission.google_maps_url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center text-body-sm text-primary hover:underline"
										>
											<MapPin className="w-4 h-4 mr-1" />
											View on Google Maps
										</Link>
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleApprove(submission.id)}
											className="text-green-500 hover:bg-green-100"
										>
											<Check className="w-6 h-6" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleReject(submission.id)}
											className="text-red-500 hover:bg-red-100"
										>
											<X className="w-6 h-6" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
