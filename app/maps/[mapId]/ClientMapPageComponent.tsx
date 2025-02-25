"use client"

import { useState, useRef, useEffect } from "react"
import { Markdown } from "@/components/markdown-renderer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
	MapPin,
	Users,
	ThumbsUp,
	ChevronUp,
	ChevronDown,
	Map,
} from "lucide-react"
import Image from "next/image"
import ShareButton from "@/components/sharebutton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLoadScript } from "@react-google-maps/api"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { createClient } from "@/lib/supabase/service/client"

interface Location {
	id: string
	map_id: string
	creator_id: string
	name: string
	latitude: number
	longitude: number
	google_maps_url: string
	note: string | null
	created_at: string
}

interface MapData {
	id: string
	title: string
	description: string
	body: string
	image: string
	locations: Location[]
	contributors: number
	upvotes: number
	username: string
	userProfilePicture: string | null
}

interface ClientMapPageContentProps {
	map: MapData
}

interface UserInfo {
	username: string
	profilePicture: string | null
}

interface PlaceDetails {
	imageUrl: string | null
	rating: number | null
	isOpenNow: boolean | null
}

const mapStyles = [
	{ featureType: "poi", stylers: [{ visibility: "off" }] },
	{ featureType: "transit", stylers: [{ visibility: "off" }] },
	{ featureType: "landscape.man_made", stylers: [{ visibility: "off" }] },
	{
		featureType: "road",
		elementType: "labels",
		stylers: [{ visibility: "off" }],
	},
	{
		featureType: "road",
		elementType: "geometry",
		stylers: [{ lightness: 70 }],
	},
	{ featureType: "water", stylers: [{ color: "#d4e4eb" }] },
]

const popupStyles = `
  @keyframes popupFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .popup-card {
    animation: popupFadeIn 0.2s ease-out;
    overflow-x: hidden; /* Prevent horizontal scrolling */
  }
`

export default function ClientMapPageContent({
	map,
}: ClientMapPageContentProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [selectedLocation, setSelectedLocation] = useState<Location | null>(
		null
	)
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
	const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null)
	const mapRef = useRef<google.maps.Map | null>(null)

	const supabase = createClient()

	const { isLoaded } = useLoadScript({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
		libraries: ["places"],
	})

	const defaultCenter = { lat: 12.9542946, lng: 77.4908558 } // Bengaluru fallback

	const getInitialMapSettings = () => {
		if (!map.locations.length) {
			return { center: defaultCenter, zoom: 12 }
		}

		const latitudes = map.locations.map((loc) => loc.latitude)
		const longitudes = map.locations.map((loc) => loc.longitude)
		const minLat = Math.min(...latitudes)
		const maxLat = Math.max(...latitudes)
		const minLng = Math.min(...longitudes)
		const maxLng = Math.max(...longitudes)

		const center = {
			lat: (minLat + maxLat) / 2,
			lng: (minLng + maxLng) / 2,
		}

		const latDiff = maxLat - minLat
		const lngDiff = maxLng - minLng
		const maxDiff = Math.max(latDiff, lngDiff)
		const zoom =
			maxDiff > 0
				? Math.min(15, Math.max(10, Math.floor(15 - Math.log2(maxDiff * 100))))
				: 15

		return { center, zoom }
	}

	const initialSettings = getInitialMapSettings()

	const fetchUserInfo = async (creatorId: string) => {
		try {
			const { data, error } = await supabase
				.from("users")
				.select("first_name, last_name, picture_url")
				.eq("id", creatorId)
				.single()

			if (error) throw error

			const username = `${data.first_name || "Unnamed"} ${
				data.last_name || "User"
			}`.trim()
			setUserInfo({
				username,
				profilePicture: data.picture_url || null,
			})
		} catch (error) {
			console.error("Error fetching user info:", error)
			setUserInfo({ username: "Unknown User", profilePicture: null })
		}
	}

	const fetchPlaceDetails = async (googleMapsUrl: string) => {
		const placeIdMatch = googleMapsUrl.match(/place_id:([^&]+)/)
		if (!placeIdMatch || !mapRef.current) {
			setPlaceDetails(null)
			return
		}

		const placeId = placeIdMatch[1]
		const placesService = new google.maps.places.PlacesService(mapRef.current)
		placesService.getDetails(
			{ placeId, fields: ["photos", "rating", "opening_hours"] },
			(place, status) => {
				if (status === google.maps.places.PlacesServiceStatus.OK && place) {
					setPlaceDetails({
						imageUrl:
							place.photos?.[0]?.getUrl({ maxWidth: 300, maxHeight: 300 }) ||
							null,
						rating: place.rating || null,
						isOpenNow: place.opening_hours?.isOpen() ?? null, // Use isOpen() for current status
					})
				} else {
					setPlaceDetails(null)
				}
			}
		)
	}

	const handleCollapse = () => setIsOpen(false)

	const onMapLoad = (googleMap: google.maps.Map) => {
		mapRef.current = googleMap
	}

	const onMarkerClick = (location: Location) => {
		setSelectedLocation(location)
		fetchUserInfo(location.creator_id)
		fetchPlaceDetails(location.google_maps_url)
	}

	const handleMapClick = () => {
		setSelectedLocation(null)
		setPlaceDetails(null)
		if (isOpen) setIsOpen(false)
	}

	if (!isLoaded) {
		return (
			<main className="bg-gray-50/50 flex flex-col min-h-screen">
				<div className="container mx-auto px-4 py-8">Loading map...</div>
			</main>
		)
	}

	return (
		<>
			<style>{popupStyles}</style>
			<main className="bg-gray-50/50 flex flex-col">
				{/* Desktop Layout */}
				<div className="hidden md:flex h-[calc(100vh-4rem)]">
					<div className="w-1/2 p-4 md:p-8 lg:p-12 space-y-6 overflow-y-auto">
						<div className="flex items-center gap-4">
							<h1 className="text-3xl font-bold tracking-tight text-foreground flex-1">
								{map.title}
							</h1>
							<div className="flex items-center gap-2">
								<Link href={`/maps/${map.id}/submit`}>
									<Button variant="default" size="sm">
										Contribute
									</Button>
								</Link>
								<ShareButton mapId={map.id} />
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-muted-foreground text-sm line-clamp-2">
								{map.description}
							</p>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Avatar className="h-8 w-8 border border-border/50">
								<AvatarImage
									src={map.userProfilePicture || "/placeholder.svg"}
								/>
								<AvatarFallback>
									{map.username
										.split(" ")
										.map((n) => n[0])
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span>
								Started by <span className="font-medium">{map.username}</span>
							</span>
						</div>
						<div className="flex gap-4 text-sm text-muted-foreground">
							<span>
								<MapPin className="inline mr-1 h-4 w-4" />
								{map.locations.length} locations
							</span>
							<span>
								<Users className="inline mr-1 h-4 w-4" />
								{map.contributors} contributors
							</span>
							<span>
								<ThumbsUp className="inline mr-1 h-4 w-4" />
								{map.upvotes} upvotes
							</span>
						</div>
						<div className="relative w-full h-[200px] mt-6">
							<Image
								src={map.image}
								alt={map.title}
								fill
								className="object-cover rounded-md"
							/>
						</div>
						<div className="mt-4">
							<Markdown content={map.body} />
						</div>
					</div>

					<div className="w-1/2">
						<GoogleMap
							mapContainerStyle={{ width: "100%", height: "100%" }}
							center={initialSettings.center}
							zoom={initialSettings.zoom}
							onLoad={onMapLoad}
							onClick={handleMapClick}
							options={{
								streetViewControl: false,
								mapTypeControl: false,
								fullscreenControl: false,
								styles: mapStyles,
							}}
						>
							{map.locations.map((location) => (
								<Marker
									key={location.id}
									position={{ lat: location.latitude, lng: location.longitude }}
									onClick={() => onMarkerClick(location)}
								/>
							))}
							{selectedLocation && userInfo && (
								<InfoWindow
									position={{
										lat: selectedLocation.latitude,
										lng: selectedLocation.longitude,
									}}
									onCloseClick={() => setSelectedLocation(null)}
								>
									<div
										className="relative w-72 bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-lg popup-card border border-gray-100"
										style={{ marginTop: "-10px" }}
									>
										<button
											onClick={() => setSelectedLocation(null)}
											className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
										>
											<svg
												className="w-4 h-4 text-gray-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
										<div className="p-4">
											<h3 className="text-lg font-semibold text-foreground mb-2 truncate">
												{selectedLocation.name}
											</h3>
											<div className="flex items-center gap-2 mb-2">
												<Avatar className="h-8 w-8 border-2 border-primary/20">
													<AvatarImage
														src={userInfo.profilePicture || "/placeholder.svg"}
													/>
													<AvatarFallback>
														{userInfo.username
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className="text-sm text-muted-foreground">
													by {userInfo.username}
												</span>
											</div>
											{placeDetails?.imageUrl ? (
												<div className="mb-3">
													<Image
														src={placeDetails.imageUrl}
														alt={selectedLocation.name}
														width={256}
														height={144}
														className="w-full h-36 object-cover rounded-md"
													/>
												</div>
											) : (
												<p className="text-xs text-muted-foreground italic mb-3">
													No image available
												</p>
											)}
											<p className="text-sm text-gray-700 leading-relaxed mb-3 bg-gray-50 p-2 rounded-md">
												{selectedLocation.note || "No description available"}
											</p>
											{placeDetails && (
												<div className="text-sm text-muted-foreground mb-3">
													{placeDetails.rating && (
														<p>Rating: {placeDetails.rating}/5</p>
													)}
													{placeDetails.isOpenNow !== null && (
														<p>
															{placeDetails.isOpenNow
																? "Open Now"
																: "Closed Now"}
														</p>
													)}
												</div>
											)}
											<Link
												href={selectedLocation.google_maps_url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center justify-center w-full bg-[#4285F4] text-white py-2 rounded-md text-sm font-medium hover:bg-[#357abd] transition-colors"
											>
												<Map className="w-4 h-4 mr-2" />
												Open in Google Maps
											</Link>
										</div>
									</div>
								</InfoWindow>
							)}
						</GoogleMap>
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="md:hidden relative h-screen">
					<div className="absolute inset-0">
						<GoogleMap
							mapContainerStyle={{ width: "100%", height: "100%" }}
							center={initialSettings.center}
							zoom={initialSettings.zoom}
							onLoad={onMapLoad}
							onClick={handleMapClick}
							options={{
								streetViewControl: false,
								mapTypeControl: false,
								fullscreenControl: false,
								styles: mapStyles,
							}}
						>
							{map.locations.map((location) => (
								<Marker
									key={location.id}
									position={{ lat: location.latitude, lng: location.longitude }}
									onClick={() => onMarkerClick(location)}
								/>
							))}
							{selectedLocation && userInfo && (
								<InfoWindow
									position={{
										lat: selectedLocation.latitude,
										lng: selectedLocation.longitude,
									}}
									onCloseClick={() => setSelectedLocation(null)}
								>
									<div
										className="relative w-72 bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-lg popup-card border border-gray-100"
										style={{ marginTop: "-10px" }}
									>
										<button
											onClick={() => setSelectedLocation(null)}
											className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
										>
											<svg
												className="w-4 h-4 text-gray-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
										<div className="p-4">
											<h3 className="text-lg font-semibold text-foreground mb-2 truncate">
												{selectedLocation.name}
											</h3>
											<div className="flex items-center gap-2 mb-2">
												<Avatar className="h-8 w-8 border-2 border-primary/20">
													<AvatarImage
														src={userInfo.profilePicture || "/placeholder.svg"}
													/>
													<AvatarFallback>
														{userInfo.username
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className="text-sm text-muted-foreground">
													by {userInfo.username}
												</span>
											</div>
											{placeDetails?.imageUrl ? (
												<div className="mb-3">
													<Image
														src={placeDetails.imageUrl}
														alt={selectedLocation.name}
														width={256}
														height={144}
														className="w-full h-36 object-cover rounded-md"
													/>
												</div>
											) : (
												<p className="text-xs text-muted-foreground italic mb-3">
													No image available
												</p>
											)}
											<p className="text-sm text-gray-700 leading-relaxed mb-3 bg-gray-50 p-2 rounded-md">
												{selectedLocation.note || "No description available"}
											</p>
											{placeDetails && (
												<div className="text-sm text-muted-foreground mb-3">
													{placeDetails.rating && (
														<p>Rating: {placeDetails.rating}/5</p>
													)}
													{placeDetails.isOpenNow !== null && (
														<p>
															{placeDetails.isOpenNow
																? "Open Now"
																: "Closed Now"}
														</p>
													)}
												</div>
											)}
											<Link
												href={selectedLocation.google_maps_url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center justify-center w-full bg-[#4285F4] text-white py-2 rounded-md text-sm font-medium hover:bg-[#357abd] transition-colors"
											>
												<Map className="w-4 h-4 mr-2" />
												Open in Google Maps
											</Link>
										</div>
									</div>
								</InfoWindow>
							)}
						</GoogleMap>
					</div>

					<div
						className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 cursor-pointer z-10"
						onClick={() => setIsOpen(!isOpen)}
					>
						<div className="flex flex-col gap-1">
							<div className="flex items-center justify-between gap-2">
								<h2 className="text-lg font-semibold truncate flex-1">
									{map.title}
								</h2>
								<ChevronUp
									className={`h-6 w-6 transition-transform ${
										isOpen ? "rotate-180" : ""
									}`}
								/>
							</div>
							<p className="text-muted-foreground text-sm truncate">
								{map.description}
							</p>
							<div className="flex flex-col gap-1 text-sm text-muted-foreground">
								<span>
									Started by <span className="font-medium">{map.username}</span>
								</span>
								<div className="flex gap-4">
									<span>
										<MapPin className="inline mr-1 h-4 w-4" />
										{map.locations.length} locations
									</span>
									<span>
										<Users className="inline mr-1 h-4 w-4" />
										{map.contributors} contributors
									</span>
									<span>
										<ThumbsUp className="inline mr-1 h-4 w-4" />
										{map.upvotes} upvotes
									</span>
								</div>
							</div>
						</div>
					</div>

					<div
						className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-transform duration-300 ease-in-out transform ${
							isOpen ? "translate-y-0" : "translate-y-full"
						} max-h-[80vh] overflow-y-auto z-20`}
					>
						<div className="p-4 space-y-4">
							<div className="flex items-center justify-between gap-2">
								<h1 className="text-2xl font-bold tracking-tight truncate flex-1">
									{map.title}
								</h1>
								<div className="flex items-center gap-2">
									<Link href={`/maps/${map.id}/submit`}>
										<Button variant="default" size="sm">
											Contribute
										</Button>
									</Link>
									<ShareButton mapId={map.id} />
									<button
										onClick={handleCollapse}
										className="p-2 rounded-full hover:bg-gray-100"
										aria-label="Collapse panel"
									>
										<ChevronDown className="h-6 w-6" />
									</button>
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-muted-foreground text-sm">
									{map.description}
								</p>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Avatar className="h-8 w-8 border border-border/50">
									<AvatarImage
										src={map.userProfilePicture || "/placeholder.svg"}
									/>
									<AvatarFallback>
										{map.username
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span>
									Started by <span className="font-medium">{map.username}</span>
								</span>
							</div>
							<div className="flex gap-4 text-sm text-muted-foreground">
								<span>
									<MapPin className="inline mr-1 h-4 w-4" />
									{map.locations.length} locations
								</span>
								<span>
									<Users className="inline mr-1 h-4 w-4" />
									{map.contributors} contributors
								</span>
								<span>
									<ThumbsUp className="inline mr-1 h-4 w-4" />
									{map.upvotes} upvotes
								</span>
							</div>
							<div className="relative w-full h-[180px] mt-4">
								<Image
									src={map.image}
									alt={map.title}
									fill
									className="object-cover rounded-md"
								/>
							</div>
							<div className="mt-4">
								<Markdown content={map.body} />
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}
