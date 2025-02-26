"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import Image from "next/image"
import { useLoadScript } from "@react-google-maps/api"
import { Check, X, MapPin } from "lucide-react"
import { getMapById } from "@/lib/supabase/maps"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/service/client"
import { Card, CardContent } from "@/components/ui/card"
import { Submission } from "@/lib/types/map"

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

			// Fetch pending submissions with user details
			const { data, error } = await supabase
				.from("locations")
				.select(
					`
          id,
          map_id,
          name,
          google_maps_url,
          note,
          creator_id,
          users!locations_creator_id_fkey (
            first_name,
            last_name,
            picture_url
          )
        `
				)
				.eq("map_id", mapId)
				.eq("is_approved", false)

			if (error) {
				console.error("Error fetching submissions:", error)
				setLoading(false)
				return
			}

			console.log("Submissions fetched:", data)

			// Fetch images, ratings, and address from Google Places API
			const dummyElement = document.createElement("div")
			const placesService = new google.maps.places.PlacesService(dummyElement)
			const submissionsWithDetails = await Promise.all(
				data.map(async (submission: any) => {
					const placeIdMatch =
						submission.google_maps_url.match(/place_id:([^&]+)/)
					let imageUrl: string | null = null
					let rating: number | null = null
					let address: string | null = null

					if (placeIdMatch) {
						const placeId = placeIdMatch[1]
						const details =
							await new Promise<google.maps.places.PlaceResult | null>(
								(resolve) => {
									placesService.getDetails(
										{
											placeId,
											fields: ["photos", "rating", "formatted_address"],
										},
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
									maxWidth: 400,
									maxHeight: 400,
								}) || null
							rating = details.rating || null
							address = details.formatted_address || null
						}
					}

					const userData = submission.users as {
						first_name: string | null
						last_name: string | null
						picture_url: string | null
					}

					return {
						id: submission.id,
						map_id: submission.map_id,
						name: submission.name,
						google_maps_url: submission.google_maps_url,
						note: submission.note,
						image_url: imageUrl,
						rating,
						address,
						submitted_by: {
							first_name: userData.first_name,
							last_name: userData.last_name,
							picture_url: userData.picture_url,
						},
					}
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
		<main className="flex flex-col min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">{`Pending Submissions for ${mapName}`}</h1>
					<p className="text-gray-500">Review and approve location submissions from contributors</p>
				</div>
				
				{submissions.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<p className="text-gray-500 text-lg">No pending submissions to review.</p>
					</div>
				) : (
					<div className="grid gap-4">
						{submissions.map((submission) => (
							<Card key={submission.id} className="overflow-hidden border-0 shadow-sm">
								<CardContent className="p-0">
									<div className="flex flex-row">
										{/* Image section - smaller */}
										<div className="w-32 h-32 bg-gray-100 flex-shrink-0">
											{submission.image_url ? (
												<Image
													src={submission.image_url}
													alt={submission.name}
													width={400}
													height={400}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
													<span className="text-xs">No Image</span>
												</div>
											)}
										</div>
										
										{/* Content section */}
										<div className="flex-1 p-4">
											<div className="flex justify-between items-start mb-2">
												<h3 className="text-lg font-semibold text-gray-900 truncate max-w-[70%]">
													{submission.name}
												</h3>
												
												<div className="flex gap-1">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleApprove(submission.id)}
														className="h-8 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
													>
														<Check className="w-3.5 h-3.5 mr-1" />
														Approve
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleReject(submission.id)}
														className="h-8 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
													>
														<X className="w-3.5 h-3.5 mr-1" />
														Reject
													</Button>
												</div>
											</div>
											
											{/* User info and rating in one row */}
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2 text-xs text-gray-600">
													<Avatar className="h-5 w-5 border border-gray-200">
														<AvatarImage
															src={
																submission.submitted_by.picture_url ||
																"/placeholder.svg"
															}
														/>
														<AvatarFallback className="text-[10px]">
															{submission.submitted_by.first_name?.[0]?.toUpperCase() ||
																"U"}
														</AvatarFallback>
													</Avatar>
													<span>
														Submitted by <span className="font-medium">{submission.submitted_by.first_name}{" "}
														{submission.submitted_by.last_name}</span>
													</span>
												</div>
												
												{/* Rating */}
												{submission.rating && (
													<div className="flex items-center">
														<div className="flex items-center text-yellow-500">
															{[...Array(5)].map((_, i) => (
																<svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
																	className={`w-3 h-3 ${i < Math.floor(submission.rating || 0) ? 'text-yellow-500' : 'text-gray-200'}`}>
																	<path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
																</svg>
															))}
															<span className="ml-1 text-xs font-medium text-gray-700">{submission.rating.toFixed(1)}</span>
														</div>
													</div>
												)}
											</div>
											
											{/* Note */}
											{submission.note && (
												<div className="bg-gray-50 p-2 rounded-md text-xs text-gray-700 mb-2">
													<p className="italic">"{submission.note}"</p>
												</div>
											)}
											
											{/* Google Maps Link at the bottom */}
											<Link
												href={submission.google_maps_url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs mt-1"
											>
												<MapPin className="w-3 h-3 mr-1" />
												View on Google Maps
											</Link>
										</div>
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
