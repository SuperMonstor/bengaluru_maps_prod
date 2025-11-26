"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Map, Clock, Star, Calendar, User, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { UserInfo } from "@/lib/hooks/useUserInfo"
import { Location, PlaceDetails } from "@/lib/hooks/useGoogleMaps"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import DeleteLocationDialog from "./DeleteLocationDialog"

interface LocationInfoWindowProps {
	location: Location
	userInfo: UserInfo
	placeDetails: PlaceDetails | null
	onClose: () => void
	currentUser: any // The logged-in user
	mapOwnerId: string // The owner ID of the map
	onLocationDeleted: () => void // Callback when location is deleted
}

// Define animation styles as a separate constant
const animationStyles = `
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.info-window {
		animation: fadeIn 0.2s ease-out;
	}

	.info-window-content {
		animation: slideUp 0.25s ease-out;
	}

	.info-section {
		animation: fadeIn 0.3s ease-out forwards;
	}

	.info-section-delayed {
		opacity: 0;
		animation: fadeIn 0.3s ease-out 0.1s forwards;
	}
`

export default function LocationInfoWindow({
	location,
	userInfo,
	placeDetails,
	onClose,
	currentUser,
	mapOwnerId,
	onLocationDeleted,
}: LocationInfoWindowProps) {
	const [showFullNote, setShowFullNote] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)

	// Check if current user can delete this location
	const canDelete =
		currentUser &&
		(currentUser.id === mapOwnerId || // Map owner
			currentUser.id === location.creator_id) // Location creator

	// Format the date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date)
	}

	// Truncate note if it's too long
	const noteIsLong = location.note && location.note.length > 120
	const displayNote =
		noteIsLong && !showFullNote
			? `${location.note?.substring(0, 120)}...`
			: location.note

	// Add animation effect when component mounts
	useEffect(() => {
		setIsVisible(true)
	}, [])

	const handleDeleteClick = () => {
		setShowDeleteDialog(true)
	}

	const handleDeleteCancel = () => {
		setShowDeleteDialog(false)
	}

	const handleLocationDeleted = () => {
		setShowDeleteDialog(false)
		onLocationDeleted()
	}

	return (
		<>
			<style>{animationStyles}</style>
			<div
				className="w-full max-w-[280px] bg-white rounded-card shadow-card-hover info-window border border-gray-300 overflow-hidden"
				style={{ maxHeight: "calc(100vh - 100px)" }}
			>
				<div className="bg-white p-md border-b border-gray-300">
					<h3 className="text-h3 text-gray-900 leading-tight">
						{location.name}
					</h3>
				</div>

				<div
					className="p-md overflow-y-auto info-window-content"
					style={{ maxHeight: "calc(100vh - 150px)" }}
				>
					<div className="flex items-center gap-sm mb-md info-section">
						<Avatar className="h-7 w-7 border border-gray-300">
							{userInfo.profilePicture ? (
								<Image
									src={userInfo.profilePicture}
									alt={userInfo.username}
									fill
									className="object-cover rounded-full"
									sizes="28px"
								/>
							) : (
								<AvatarFallback>
									{userInfo.username
										.split(" ")
										.map((n) => n[0])
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							)}
						</Avatar>
						<div className="flex flex-col">
							<span className="text-caption text-gray-500">Added by</span>
							<div className="flex items-center gap-1">
								<span className="text-body-sm font-medium text-gray-900">{userInfo.username}</span>
								<span className="text-caption text-gray-500">
									• {formatDate(location.created_at)}
								</span>
							</div>
						</div>
					</div>

					{placeDetails?.imageUrl ? (
						<div className="mb-md info-section-delayed">
							<Image
								src={placeDetails.imageUrl}
								alt={location.name}
								width={600}
								height={400}
								className="w-full h-32 object-cover rounded-image"
								priority
							/>
						</div>
					) : null}

					{/* Status and Ratings Section */}
					{placeDetails && (
						<div className="mb-md p-sm bg-gray-100 rounded-image info-section-delayed">
							<div className="flex justify-between items-center mb-1">
								{placeDetails.isOpenNow !== null && (
									<span
										className={`text-body-sm font-medium ${
											placeDetails.isOpenNow ? "text-green-600" : "text-red-600"
										}`}
									>
										{placeDetails.isOpenNow ? "Open Now" : "Closed Now"}
									</span>
								)}

								{placeDetails.rating && (
									<div className="flex items-center gap-1">
										<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
										<span className="text-body-sm font-medium text-gray-900">
											{placeDetails.rating.toFixed(1)}/5
										</span>
									</div>
								)}
							</div>

							{/* Today's hours */}
							{placeDetails.todayHours && (
								<div className="flex items-center gap-sm text-caption text-gray-500">
									<Clock className="h-3 w-3 flex-shrink-0" />
									<span className="break-words">
										Today: {placeDetails.todayHours}
									</span>
								</div>
							)}
						</div>
					)}

					{/* Note Section */}
					{location.note && (
						<div className="mb-md info-section-delayed">
							<div className="flex items-center gap-sm mb-sm">
								<User className="h-4 w-4 text-gray-500" />
								<span className="text-caption font-medium text-gray-500">
									Note from contributor:
								</span>
							</div>
							<div className="text-body-sm text-gray-700 bg-gray-100 p-sm rounded-image">
								<p className="break-words">{displayNote}</p>
								{noteIsLong && (
									<button
										onClick={() => setShowFullNote(!showFullNote)}
										className="text-caption text-brand-orange mt-sm hover:underline"
									>
										{showFullNote ? "Show less" : "Read more"}
									</button>
								)}
							</div>
						</div>
					)}

					<div className="flex flex-col gap-sm">
						<Link
							href={
								location.google_maps_url.includes("place/?q=place_id:")
									? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
											location.name
									  )}&query_place_id=${
											location.google_maps_url.split("place_id:")[1]
									  }`
									: location.google_maps_url.includes("maps.google.com/?cid=")
									? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
											location.name
									  )}&query_place_id=${
											location.google_maps_url.split("cid=")[1]
									  }`
									: location.google_maps_url
							}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center w-full bg-[#4285f4] text-white py-sm rounded-button text-body-sm font-medium hover:bg-[#3367d6] transition-all duration-200 shadow-button info-section-delayed"
						>
							<Map className="w-4 h-4 mr-sm" />
							Open in Google Maps
						</Link>

						{/* Delete button - only shown if user can delete */}
						{canDelete && (
							<Button
								variant="destructive"
								size="sm"
								className="w-full info-section-delayed"
								onClick={handleDeleteClick}
							>
								<Trash2 className="w-4 h-4 mr-sm" />
								Delete Location
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Delete confirmation dialog */}
			{showDeleteDialog && (
				<DeleteLocationDialog
					locationId={location.id}
					locationName={location.name}
					onDeleted={handleLocationDeleted}
					onCancel={handleDeleteCancel}
				/>
			)}
		</>
	)
}
