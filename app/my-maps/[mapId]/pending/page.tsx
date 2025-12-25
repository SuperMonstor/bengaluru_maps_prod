"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/components/layout/LayoutClient"
import Image from "next/image"
import { useLoadScript } from "@react-google-maps/api"
import { Check, X, MapPin, Loader2 } from "lucide-react"
import { getMapById } from "@/lib/supabase/mapsService"
import {
	approveLocation,
	rejectLocation,
} from "@/lib/supabase/mapSubmissionService"
import { fetchPendingSubmissionsAction } from "@/lib/supabase/api/fetchPendingSubmissionsAction"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Submission } from "@/lib/types/mapTypes"
import { useToast } from "@/lib/hooks/use-toast"
import { usePendingCount } from "@/lib/context/PendingCountContext"

// Define action types for better type safety
type ActionType = "approve" | "reject" | null

export default function PendingSubmissionsPage({
	params,
}: {
	params: Promise<{ mapId: string }>
}) {
	const { user } = useUser()
	const [submissions, setSubmissions] = useState<Submission[]>([])
	const [mapName, setMapName] = useState<string>("")
	const [loading, setLoading] = useState(true)
	const [processingItems, setProcessingItems] = useState<
		Record<string, ActionType>
	>({})
	const { refreshPendingCount } = usePendingCount()
	const { toast } = useToast()

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
				setMapName(mapData.name || mapData.title || "Unknown Map")
			}

			// Fetch pending submissions using secure server action
			const result = await fetchPendingSubmissionsAction(mapId)

			if (!result.success || result.error) {
				console.error("Error fetching submissions:", result.error)
				toast({
					title: "Error",
					description: result.error || "Failed to fetch pending submissions",
					variant: "destructive",
				})
				setLoading(false)
				return
			}

			const { data, error } = result

			if (!data) {
				console.log("No submissions data returned")
				setSubmissions([])
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

	const handleApprove = async (locationId: string) => {
		// Set this location as processing with 'approve' action
		setProcessingItems((prev) => ({ ...prev, [locationId]: "approve" }))

		try {
			const { success, error } = await approveLocation(locationId)

			if (success) {
				// Update UI and refresh pending count
				setSubmissions((prev) => prev.filter((loc) => loc.id !== locationId))
				refreshPendingCount()

				toast({
					title: "Location approved",
					description: "The location has been added to your map.",
				})
			} else {
				toast({
					variant: "destructive",
					title: "Error",
					description: error || "Failed to approve location. Please try again.",
				})
			}
		} catch (err) {
			console.error("Error in approve handler:", err)
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred. Please try again.",
			})
		} finally {
			// Remove this location from processing state
			setProcessingItems((prev) => {
				const newState = { ...prev }
				delete newState[locationId]
				return newState
			})
		}
	}

	const handleReject = async (locationId: string) => {
		// Set this location as processing with 'reject' action
		setProcessingItems((prev) => ({ ...prev, [locationId]: "reject" }))

		try {
			const { success, error } = await rejectLocation(locationId)

			if (success) {
				// Update UI and refresh pending count
				setSubmissions((prev) => prev.filter((loc) => loc.id !== locationId))
				refreshPendingCount()

				toast({
					title: "Location rejected",
					description: "The location has been rejected.",
				})
			} else {
				toast({
					variant: "destructive",
					title: "Error",
					description: error || "Failed to reject location. Please try again.",
				})
			}
		} catch (err) {
			console.error("Error in reject handler:", err)
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred. Please try again.",
			})
		} finally {
			// Remove this location from processing state
			setProcessingItems((prev) => {
				const newState = { ...prev }
				delete newState[locationId]
				return newState
			})
		}
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
				<div className="container mx-auto px-4 py-8 flex items-center justify-center">
					<div className="flex items-center gap-2">
						<Loader2 className="h-5 w-5 animate-spin text-gray-500" />
						<span>Loading submissions...</span>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="flex flex-col min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-4 md:mb-8">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
						{`Pending Submissions for ${mapName}`}
					</h1>
					<p className="text-sm md:text-base text-gray-500">
						Review and approve location submissions from contributors
					</p>
				</div>

				{submissions.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-6 md:p-8 text-center">
						<p className="text-gray-500 text-base md:text-lg">
							No pending submissions to review.
						</p>
					</div>
				) : (
					<div className="grid gap-3 md:gap-4">
						{submissions.map((submission) => (
							<Card
								key={submission.id}
								className="overflow-hidden border-0 shadow-sm"
							>
								<CardContent className="p-0">
									<div className="flex flex-col sm:flex-row">
										{/* Image section - full width on mobile, fixed width on desktop */}
										<div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-100 flex-shrink-0">
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
										<div className="flex-1 p-3 sm:p-4">
											<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
												<h3 className="text-lg font-semibold text-gray-900 truncate max-w-full sm:max-w-[70%]">
													{submission.name}
												</h3>

												<div className="flex gap-1 self-end sm:self-auto">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleApprove(submission.id)}
														disabled={!!processingItems[submission.id]}
														className="h-8 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
													>
														{processingItems[submission.id] === "approve" ? (
															<>
																<Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
																Approving...
															</>
														) : (
															<>
																<Check className="w-3.5 h-3.5 mr-1" />
																Approve
															</>
														)}
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleReject(submission.id)}
														disabled={!!processingItems[submission.id]}
														className="h-8 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
													>
														{processingItems[submission.id] === "reject" ? (
															<>
																<Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
																Rejecting...
															</>
														) : (
															<>
																<X className="w-3.5 h-3.5 mr-1" />
																Reject
															</>
														)}
													</Button>
												</div>
											</div>

											{/* User info and rating in one row */}
											<div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0 mb-2">
												<div className="flex items-center gap-2 text-xs text-gray-600">
													<Avatar className="h-5 w-5 border border-gray-200">
														{submission.submitted_by.picture_url ? (
															<Image
																src={submission.submitted_by.picture_url}
																alt={`${submission.submitted_by.first_name} ${submission.submitted_by.last_name}`}
																fill
																className="object-cover rounded-full"
																sizes="20px"
															/>
														) : (
															<AvatarFallback className="text-[10px]">
																{submission.submitted_by.first_name?.[0]?.toUpperCase() ||
																	"U"}
															</AvatarFallback>
														)}
													</Avatar>
													<span>
														Submitted by{" "}
														<span className="font-medium">
															{submission.submitted_by.first_name}{" "}
															{submission.submitted_by.last_name}
														</span>
													</span>
												</div>

												{/* Rating */}
												{submission.rating && (
													<div className="flex items-center">
														<div className="flex items-center text-yellow-500">
															{[...Array(5)].map((_, i) => (
																<svg
																	key={i}
																	xmlns="http://www.w3.org/2000/svg"
																	viewBox="0 0 24 24"
																	fill="currentColor"
																	className={`w-3 h-3 ${
																		i < Math.floor(submission.rating || 0)
																			? "text-yellow-500"
																			: "text-gray-200"
																	}`}
																>
																	<path
																		fillRule="evenodd"
																		d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
																		clipRule="evenodd"
																	/>
																</svg>
															))}
															<span className="ml-1 text-xs font-medium text-gray-700">
																{submission.rating.toFixed(1)}
															</span>
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
