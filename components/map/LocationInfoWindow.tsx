"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Map, Clock, Star, Calendar, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { UserInfo } from "@/lib/hooks/useUserInfo"
import { Location, PlaceDetails } from "@/lib/hooks/useGoogleMaps"
import { useState } from "react"

interface LocationInfoWindowProps {
	location: Location
	userInfo: UserInfo
	placeDetails: PlaceDetails | null
	onClose: () => void
}

export default function LocationInfoWindow({
	location,
	userInfo,
	placeDetails,
	onClose,
}: LocationInfoWindowProps) {
	const [showFullNote, setShowFullNote] = useState(false)

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

	return (
		<div
			className="w-full max-w-[280px] bg-white rounded-lg shadow-md popup-card border border-gray-100 overflow-hidden"
			style={{ maxHeight: "calc(100vh - 100px)" }}
		>
			<div className="bg-white p-3 border-b border-gray-100">
				<h3 className="text-base font-semibold text-foreground leading-tight">
					{location.name}
				</h3>
			</div>

			<div
				className="p-3 overflow-y-auto"
				style={{ maxHeight: "calc(100vh - 150px)" }}
			>
				<div className="flex items-center gap-2 mb-3">
					<Avatar className="h-7 w-7 border border-border/50">
						<AvatarImage src={userInfo.profilePicture || "/placeholder.svg"} />
						<AvatarFallback>
							{userInfo.username
								.split(" ")
								.map((n) => n[0])
								.join("")
								.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="text-xs text-muted-foreground">Added by</span>
						<div className="flex items-center gap-1">
							<span className="text-sm font-medium">{userInfo.username}</span>
							<span className="text-xs text-muted-foreground">
								• {formatDate(location.created_at)}
							</span>
						</div>
					</div>
				</div>

				{placeDetails?.imageUrl ? (
					<div className="mb-3">
						<Image
							src={placeDetails.imageUrl}
							alt={location.name}
							width={600}
							height={400}
							className="w-full h-32 object-cover rounded-md"
							priority
						/>
					</div>
				) : null}

				{/* Status and Ratings Section */}
				{placeDetails && (
					<div className="mb-3 p-2 bg-gray-50 rounded-md">
						<div className="flex justify-between items-center mb-1">
							{placeDetails.isOpenNow !== null && (
								<span
									className={`text-sm font-medium ${
										placeDetails.isOpenNow ? "text-green-600" : "text-red-600"
									}`}
								>
									{placeDetails.isOpenNow ? "Open Now" : "Closed Now"}
								</span>
							)}

							{placeDetails.rating && (
								<div className="flex items-center gap-1">
									<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
									<span className="text-sm font-medium">
										{placeDetails.rating.toFixed(1)}/5
									</span>
								</div>
							)}
						</div>

						{/* Today's hours */}
						{placeDetails.todayHours && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
					<div className="mb-3">
						<div className="flex items-center gap-1.5 mb-1">
							<User className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="text-xs font-medium text-muted-foreground">
								Note from contributor:
							</span>
						</div>
						<div className="text-sm text-foreground/90 bg-gray-50 p-2 rounded-md">
							<p className="break-words">{displayNote}</p>
							{noteIsLong && (
								<button
									onClick={() => setShowFullNote(!showFullNote)}
									className="text-xs text-primary mt-1 hover:underline"
								>
									{showFullNote ? "Show less" : "Read more"}
								</button>
							)}
						</div>
					</div>
				)}

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
							  )}&query_place_id=${location.google_maps_url.split("cid=")[1]}`
							: location.google_maps_url
					}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center w-full bg-[#E53935] text-white py-2 rounded-md text-sm font-medium hover:bg-[#D32F2F] transition-colors"
				>
					<Map className="w-4 h-4 mr-2" />
					Open in Google Maps
				</Link>
			</div>
		</div>
	)
}
