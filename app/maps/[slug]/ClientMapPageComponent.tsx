"use client"

import { useState, useEffect, useRef } from "react"
import { Markdown } from "@/components/markdown/MarkdownRenderer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
	MapPin,
	Users,
	ChevronUp,
	ChevronDown,
	Edit,
	Clock,
	Star,
	User,
	ExternalLink,
	Trash2,
} from "lucide-react"
import Image from "next/image"
import ShareButton from "@/components/custom-ui/ShareButton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GoogleMap, Marker } from "@react-google-maps/api"
import { useGoogleMaps, Location } from "@/lib/hooks/useGoogleMaps"
import { useUserInfo } from "@/lib/hooks/useUserInfo"
import { UpvoteButton } from "@/components/custom-ui/UpvoteButton"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/components/layout/LayoutClient"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import DeleteLocationDialog from "@/components/map/DeleteLocationDialog"
import { Suspense } from "react"

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
	owner_id?: string
	hasUpvoted: boolean
	slug?: string
}

interface ClientMapPageContentProps {
	map: MapData
	initialIsUpvoted?: boolean
	user?: any
	searchParams?: { [key: string]: string | string[] | undefined }
}

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
		overflow-x: hidden;
	}
`

// Custom marker with different colors for selected/unselected state
const CustomMarker = ({ position, onClick, isSelected }: any) => {
	return (
		<Marker
			position={position}
			onClick={onClick}
			icon={{
				path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
				fillColor: isSelected ? "#2563EB" : "#E53935", // Blue when selected, red when not
				fillOpacity: 1,
				strokeWeight: 2,
				strokeColor: "#FFFFFF",
				scale: isSelected ? 1.8 : 1.5, // Slightly larger when selected
				anchor: new google.maps.Point(12, 22),
			}}
		/>
	)
}

// Component that uses useSearchParams
function ClientMapPageContentInner({
	map,
	initialIsUpvoted = false,
	user,
	searchParams,
}: ClientMapPageContentProps) {
	const searchParamsObj = useSearchParams()
	const shouldExpand =
		searchParams?.expand === "true" || searchParamsObj.get("expand") === "true"
	const [isOpen, setIsOpen] = useState(shouldExpand)
	const [isExiting, setIsExiting] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showFullNote, setShowFullNote] = useState(false)

	const {
		isLoaded,
		mapRef,
		selectedLocation,
		setSelectedLocation,
		placeDetails,
		fetchPlaceDetails,
		initialSettings,
		onMapLoad,
		mapStyles,
	} = useGoogleMaps(map.locations)

	const { userInfo, fetchUserInfo } = useUserInfo()
	const { user: authUser } = useUser()

	const handleCollapse = () => {
		setIsExiting(true)
		setTimeout(() => {
			setIsOpen(false)
			setIsExiting(false)
		}, 300) // Match the animation duration
	}

	const mapStateRef = useRef({
		center: null as google.maps.LatLng | null | undefined,
		zoom: null as number | null | undefined,
	})

	const handleMapLoad = (map: google.maps.Map) => {
		onMapLoad(map)

		const center = map.getCenter()
		const zoom = map.getZoom()

		if (center) mapStateRef.current.center = center
		if (zoom !== undefined) mapStateRef.current.zoom = zoom

		map.addListener("idle", () => {
			if (!selectedLocation) {
				const center = map.getCenter()
				const zoom = map.getZoom()

				if (center) mapStateRef.current.center = center
				if (zoom !== undefined) mapStateRef.current.zoom = zoom
			}
		})
	}

	const onMarkerClick = (location: Location) => {
		// If clicking the same marker, deselect it
		if (selectedLocation && selectedLocation.id === location.id) {
			setSelectedLocation(null)
			return
		}

		setSelectedLocation(location)
		fetchUserInfo(location.creator_id)
		fetchPlaceDetails(location.google_maps_url)

		// Always open the bottom panel when a location is selected
		setIsOpen(true)
	}

	const handleInfoWindowClose = () => {
		if (
			mapRef.current &&
			mapStateRef.current.center &&
			mapStateRef.current.zoom
		) {
			mapRef.current.setCenter(mapStateRef.current.center)
			mapRef.current.setZoom(mapStateRef.current.zoom)
		}
		setSelectedLocation(null)
	}

	const handleMapClick = (e: google.maps.MapMouseEvent) => {
		// Only deselect if it's a direct map click, not a marker click
		if ((e as any).placeId) return

		setSelectedLocation(null)
		// Don't close the panel on map click, just deselect the location
	}

	const handleLocationDeleted = () => {
		setSelectedLocation(null)
		setShowDeleteDialog(false)
		window.location.reload()
	}

	// Format the date
	const formatDate = (dateString: string) => {
		if (!dateString) return ""
		const date = new Date(dateString)
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date)
	}

	// Effect to ensure slider stays expanded when expand parameter is present
	useEffect(() => {
		if (shouldExpand) {
			setIsOpen(true)
		}
	}, [shouldExpand])

	useEffect(() => {
		if (!isLoaded || !mapRef.current) return

		// Apply optimal zoom and bounds
		const bounds = new google.maps.LatLngBounds()
		map.locations.forEach((location) => {
			bounds.extend({ lat: location.latitude, lng: location.longitude })
		})

		if (map.locations.length > 1) {
			mapRef.current.fitBounds(bounds)
		} else if (map.locations.length === 1) {
			mapRef.current.setCenter({
				lat: map.locations[0].latitude,
				lng: map.locations[0].longitude,
			})
			mapRef.current.setZoom(15)
		}

		// Ensure zoom stays within a reasonable range
		const listener = google.maps.event.addListenerOnce(
			mapRef.current,
			"idle",
			() => {
				const currentZoom = mapRef.current?.getZoom()
				if (currentZoom && currentZoom < 10) mapRef.current?.setZoom(10)
				if (currentZoom && currentZoom > 15) mapRef.current?.setZoom(15)
			}
		)

		return () => {
			google.maps.event.removeListener(listener)
		}
	}, [isLoaded, map.locations])

	// Use the filtered locations count to match server-side logic
	const approvedLocationsCount = map.locations.filter(
		(location) => location.is_approved
	).length

	// Check if current user can delete the selected location
	const canDelete =
		selectedLocation &&
		user &&
		(user.id === map.owner_id || user.id === selectedLocation.creator_id)

	// Truncate note if it's too long
	const noteIsLong =
		selectedLocation?.note && selectedLocation.note.length > 120
	const displayNote =
		selectedLocation?.note &&
		(noteIsLong && !showFullNote
			? `${selectedLocation.note.substring(0, 120)}...`
			: selectedLocation.note)

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-72px)] w-full">
				<LoadingIndicator message="Loading map details..." />
			</div>
		)
	}

	return (
		<>
			<style>{popupStyles}</style>
			<div className="flex flex-col h-[calc(100vh-72px)] w-full">
				{/* Desktop Layout */}
				<div className="hidden md:flex h-full w-full">
					<div
						className={`w-2/5 max-w-[500px] p-4 md:p-8 lg:p-12 space-y-6 overflow-y-auto bg-white ${
							selectedLocation ? "border-r-4 border-r-blue-500/20" : ""
						}`}
					>
						{!selectedLocation ? (
							<>
								<div className="flex items-center justify-between">
									<div className="flex-shrink-0">
										{user && user.id === map.owner_id && (
											<Link href={`/maps/${map.slug || "map"}/edit`}>
												<Button
													variant="outline"
													size="sm"
													className="flex items-center gap-1"
												>
													<Edit className="h-4 w-4" />
													Edit
												</Button>
											</Link>
										)}
									</div>
								</div>

								<h1 className="text-3xl font-bold tracking-tight text-foreground mt-4 mb-4">
									{map.title}
								</h1>

								<div className="flex items-center gap-2 mb-4">
									<Link href={`/maps/${map.slug || "map"}/submit`}>
										<Button variant="default" size="sm">
											Contribute
										</Button>
									</Link>
									<ShareButton
										mapId={map.id}
										slug={map.slug}
										title={map.title}
										description={map.description}
										image={map.image}
									/>
								</div>

								<div className="space-y-2">
									<p className="text-muted-foreground text-sm line-clamp-2">
										{map.description}
									</p>
								</div>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Avatar className="h-8 w-8 border border-border/50">
										{map.userProfilePicture ? (
											<Image
												src={map.userProfilePicture}
												alt={map.username}
												fill
												className="object-cover rounded-full"
												sizes="32px"
											/>
										) : (
											<AvatarFallback>
												{map.username
													.split(" ")
													.map((n) => n[0])
													.join("")
													.toUpperCase()}
											</AvatarFallback>
										)}
									</Avatar>
									<span>
										Started by{" "}
										<span className="font-medium">{map.username}</span>
									</span>
								</div>
								<div className="flex gap-4 text-sm text-muted-foreground">
									<UpvoteButton
										mapId={map.id}
										initialUpvotes={map.upvotes}
										initialIsUpvoted={map.hasUpvoted}
										variant="pill"
									/>
									<span>
										<MapPin className="inline mr-1 h-4 w-4" />
										{approvedLocationsCount} locations
									</span>
									<span>
										<Users className="inline mr-1 h-4 w-4" />
										{map.contributors} contributors
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
								<div className="mt-4 pb-24">
									<Markdown content={map.body} />
								</div>
							</>
						) : userInfo ? (
							<>
								{/* Location details for desktop */}
								<div className="flex items-center justify-between">
									<button
										onClick={() => setSelectedLocation(null)}
										className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
									>
										<ChevronDown className="h-4 w-4 rotate-90" />
										Back to map
									</button>

									<div className="flex items-center gap-2">
										<ShareButton
											mapId={map.id}
											slug={map.slug}
											title={selectedLocation.name}
											description={selectedLocation.note || ""}
											image={placeDetails?.imageUrl || map.image}
										/>
									</div>
								</div>

								<h1 className="text-2xl font-bold tracking-tight text-foreground mt-4 mb-4">
									{selectedLocation.name}
								</h1>

								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Avatar className="h-8 w-8 border border-border/50">
										{userInfo.profilePicture ? (
											<Image
												src={userInfo.profilePicture}
												alt={userInfo.username}
												fill
												className="object-cover rounded-full"
												sizes="32px"
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
									<span>
										Added by{" "}
										<span className="font-medium">{userInfo.username}</span>
										<span className="text-xs text-muted-foreground ml-1">
											• {formatDate(selectedLocation.created_at)}
										</span>
									</span>
								</div>

								{/* Location image */}
								{placeDetails?.imageUrl && (
									<div className="relative w-full h-[200px] mt-4">
										<Image
											src={placeDetails.imageUrl}
											alt={selectedLocation.name}
											fill
											className="object-cover rounded-md"
											priority
										/>
									</div>
								)}

								{/* Status and Ratings Section */}
								{placeDetails && (
									<div className="p-4 bg-gray-50 rounded-md">
										<div className="flex justify-between items-center mb-2">
											{placeDetails.isOpenNow !== null && (
												<span
													className={`text-sm font-medium ${
														placeDetails.isOpenNow
															? "text-green-600"
															: "text-red-600"
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
								{displayNote && (
									<div>
										<div className="flex items-center gap-1.5 mb-1">
											<User className="h-3.5 w-3.5 text-muted-foreground" />
											<span className="text-xs font-medium text-muted-foreground">
												Note from contributor:
											</span>
										</div>
										<div className="text-sm text-foreground/90 bg-gray-50 p-4 rounded-md">
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

								{/* Action buttons */}
								<div className="flex flex-col gap-3">
									<Link
										href={
											selectedLocation.google_maps_url.includes(
												"place/?q=place_id:"
											)
												? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
														selectedLocation.name
												  )}&query_place_id=${
														selectedLocation.google_maps_url.split(
															"place_id:"
														)[1]
												  }`
												: selectedLocation.google_maps_url.includes(
														"maps.google.com/?cid="
												  )
												? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
														selectedLocation.name
												  )}&query_place_id=${
														selectedLocation.google_maps_url.split("cid=")[1]
												  }`
												: selectedLocation.google_maps_url
										}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button
											variant="default"
											className="w-full bg-[#E53935] hover:bg-[#D32F2F]"
										>
											<ExternalLink className="h-4 w-4 mr-2" />
											View on Google Maps
										</Button>
									</Link>

									{canDelete && (
										<Button
											variant="outline"
											className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full"
											onClick={() => setShowDeleteDialog(true)}
										>
											<Trash2 className="h-4 w-4" />
											Delete Location
										</Button>
									)}

									<Link
										href={`/maps/${map.slug || "map"}/submit`}
										className="w-full"
									>
										<Button variant="outline" className="w-full">
											Add New Location
										</Button>
									</Link>
								</div>
							</>
						) : (
							<div className="flex items-center justify-center h-full">
								<LoadingIndicator message="Loading location details..." />
							</div>
						)}
					</div>

					<div className="flex-1 h-full">
						<GoogleMap
							mapContainerStyle={{ width: "100%", height: "100%" }}
							center={initialSettings.center}
							zoom={initialSettings.zoom}
							onLoad={handleMapLoad}
							onClick={handleMapClick}
							options={{
								streetViewControl: false,
								mapTypeControl: false,
								fullscreenControl: false,
								styles: mapStyles,
								gestureHandling: "greedy",
								maxZoom: 18,
								minZoom: 3,
								disableDefaultUI: false,
								zoomControl: false,
								clickableIcons: false,
							}}
						>
							{map.locations
								.filter((location) => location.is_approved)
								.map((location) => (
									<CustomMarker
										key={location.id}
										position={{
											lat: location.latitude,
											lng: location.longitude,
										}}
										onClick={() => onMarkerClick(location)}
										isSelected={selectedLocation?.id === location.id}
									/>
								))}
						</GoogleMap>
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="md:hidden h-full w-full relative">
					{/* Map container */}
					<div className="absolute inset-0">
						<GoogleMap
							mapContainerStyle={{ width: "100%", height: "100%" }}
							center={initialSettings.center}
							zoom={initialSettings.zoom}
							onLoad={handleMapLoad}
							onClick={handleMapClick}
							options={{
								streetViewControl: false,
								mapTypeControl: false,
								fullscreenControl: false,
								styles: mapStyles,
								gestureHandling: "greedy",
								maxZoom: 18,
								minZoom: 3,
								disableDefaultUI: false,
								zoomControl: false,
								clickableIcons: false,
							}}
						>
							{map.locations
								.filter((location) => location.is_approved)
								.map((location) => (
									<CustomMarker
										key={location.id}
										position={{
											lat: location.latitude,
											lng: location.longitude,
										}}
										onClick={() => onMarkerClick(location)}
										isSelected={selectedLocation?.id === location.id}
									/>
								))}
						</GoogleMap>
					</div>

					{/* Bottom panel - only shown when not expanded */}
					{!isOpen && (
						<div
							className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4 cursor-pointer z-50 animate-slide-up"
							onClick={() => setIsOpen(true)}
						>
							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold truncate flex-1">
										{selectedLocation ? selectedLocation.name : map.title}
									</h2>
									<div className="flex items-center gap-2">
										{user && user.id === map.owner_id && (
											<Link
												href={`/maps/${map.slug || "map"}/edit`}
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="outline"
													size="sm"
													className="flex items-center gap-1 p-1"
												>
													<Edit className="h-4 w-4" />
												</Button>
											</Link>
										)}
										<div className="bg-gray-100 rounded-full p-1">
											<ChevronUp className="h-5 w-5" />
										</div>
									</div>
								</div>
								<p className="text-muted-foreground text-sm truncate">
									{selectedLocation
										? selectedLocation.note || "Tap to see details"
										: map.description}
								</p>

								{selectedLocation && (
									<div className="flex gap-2 mt-1">
										<Link
											href={selectedLocation.google_maps_url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex-1"
											onClick={(e: React.MouseEvent) => e.stopPropagation()}
										>
											<Button
												variant="default"
												size="sm"
												className="w-full bg-[#E53935] hover:bg-[#D32F2F] text-xs h-8"
											>
												<ExternalLink className="h-3 w-3 mr-1" />
												View on Maps
											</Button>
										</Link>
										<div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
											<ShareButton
												mapId={map.id}
												slug={map.slug}
												title={selectedLocation.name}
												description={selectedLocation.note || ""}
												image={placeDetails?.imageUrl || map.image}
											/>
										</div>
									</div>
								)}

								<div className="flex gap-4 text-sm text-muted-foreground pt-1">
									{!selectedLocation ? (
										<>
											<UpvoteButton
												mapId={map.id}
												initialUpvotes={map.upvotes}
												initialIsUpvoted={map.hasUpvoted}
												variant="pill"
											/>
											<span className="flex items-center">
												<MapPin className="mr-1 h-4 w-4" />
												{approvedLocationsCount}
											</span>
											<span className="flex items-center">
												<Users className="mr-1 h-4 w-4" />
												{map.contributors}
											</span>
										</>
									) : (
										<>
											{placeDetails?.isOpenNow !== null && (
												<span
													className={`flex items-center ${
														placeDetails?.isOpenNow
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													<Clock className="mr-1 h-4 w-4" />
													{placeDetails?.isOpenNow ? "Open" : "Closed"}
												</span>
											)}
											{placeDetails?.rating && (
												<span className="flex items-center">
													<Star className="mr-1 h-4 w-4 text-yellow-500" />
													{placeDetails.rating.toFixed(1)}
												</span>
											)}
										</>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Expanded panel - only shown when expanded */}
					{isOpen && (
						<div
							className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 max-h-[85vh] h-auto overflow-y-auto ${
								isExiting ? "animate-slide-down" : "animate-slide-up"
							}`}
						>
							<div className="sticky top-0 bg-white p-4 border-b border-gray-100">
								<div className="flex items-center justify-between">
									<h1 className="text-xl font-bold tracking-tight truncate flex-1">
										{selectedLocation ? selectedLocation.name : map.title}
									</h1>
									<div className="flex items-center gap-2">
										{user && user.id === map.owner_id && (
											<Link
												href={`/maps/${map.slug || "map"}/edit`}
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="outline"
													size="sm"
													className="flex items-center gap-1 p-1"
												>
													<Edit className="h-4 w-4" />
												</Button>
											</Link>
										)}
										<button
											onClick={handleCollapse}
											className="p-2 rounded-full hover:bg-gray-100"
											aria-label="Collapse panel"
										>
											<ChevronDown className="h-5 w-5" />
										</button>
									</div>
								</div>

								{!selectedLocation ? (
									<>
										<div className="flex items-center gap-3 mt-3">
											<Avatar className="h-8 w-8">
												{map.userProfilePicture ? (
													<Image
														src={map.userProfilePicture}
														alt={map.username}
														fill
														className="object-cover rounded-full"
														sizes="32px"
													/>
												) : (
													<AvatarFallback>
														{map.username.charAt(0).toUpperCase()}
													</AvatarFallback>
												)}
											</Avatar>
											<p className="text-sm">
												Created by{" "}
												<span className="font-medium">{map.username}</span>
											</p>
										</div>

										<div className="flex items-center gap-2 mt-3">
											<Link
												href={`/maps/${map.slug || "map"}/submit`}
												className="flex-1"
											>
												<Button variant="default" size="sm" className="w-full">
													Add Location
												</Button>
											</Link>
											<ShareButton
												mapId={map.id}
												slug={map.slug}
												title={map.title}
												description={map.description}
												image={map.image}
											/>
										</div>
									</>
								) : userInfo ? (
									<>
										<div className="flex items-center gap-3 mt-3">
											<Avatar className="h-8 w-8">
												{userInfo.profilePicture ? (
													<Image
														src={userInfo.profilePicture}
														alt={userInfo.username}
														fill
														className="object-cover rounded-full"
														sizes="32px"
													/>
												) : (
													<AvatarFallback>
														{userInfo.username.charAt(0).toUpperCase()}
													</AvatarFallback>
												)}
											</Avatar>
											<p className="text-sm">
												Added by{" "}
												<span className="font-medium">{userInfo.username}</span>
												<span className="text-xs text-muted-foreground ml-1">
													• {formatDate(selectedLocation.created_at)}
												</span>
											</p>
										</div>

										<div className="flex items-center gap-2 mt-3">
											<Link
												href={
													selectedLocation.google_maps_url.includes(
														"place/?q=place_id:"
													)
														? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
																selectedLocation.name
														  )}&query_place_id=${
																selectedLocation.google_maps_url.split(
																	"place_id:"
																)[1]
														  }`
														: selectedLocation.google_maps_url.includes(
																"maps.google.com/?cid="
														  )
														? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
																selectedLocation.name
														  )}&query_place_id=${
																selectedLocation.google_maps_url.split(
																	"cid="
																)[1]
														  }`
														: selectedLocation.google_maps_url
												}
												target="_blank"
												rel="noopener noreferrer"
												className="flex-1"
											>
												<Button
													variant="default"
													size="sm"
													className="w-full bg-[#E53935] hover:bg-[#D32F2F]"
												>
													<ExternalLink className="h-4 w-4 mr-2" />
													View on Maps
												</Button>
											</Link>
											<ShareButton
												mapId={map.id}
												slug={map.slug}
												title={selectedLocation.name}
												description={selectedLocation.note || ""}
												image={placeDetails?.imageUrl || map.image}
											/>
										</div>
									</>
								) : null}
							</div>

							<div className="p-4 space-y-3 pb-safe">
								{!selectedLocation ? (
									<>
										<div className="flex gap-4 text-sm text-muted-foreground">
											<UpvoteButton
												mapId={map.id}
												initialUpvotes={map.upvotes}
												initialIsUpvoted={map.hasUpvoted}
												variant="pill"
											/>
											<span className="flex items-center">
												<MapPin className="mr-1 h-4 w-4" />
												{approvedLocationsCount} locations
											</span>
											<span className="flex items-center">
												<Users className="mr-1 h-4 w-4" />
												{map.contributors} contributors
											</span>
										</div>

										<p className="text-muted-foreground">{map.description}</p>

										{/* Map content */}
										<div className="prose prose-sm max-w-none mt-2 pt-2 border-t border-gray-100">
											<Markdown content={map.body} />
										</div>
									</>
								) : (
									<>
										{/* Location details */}
										{placeDetails?.imageUrl && (
											<div className="mb-3">
												<Image
													src={placeDetails.imageUrl}
													alt={selectedLocation.name}
													width={600}
													height={400}
													className="w-full h-40 object-cover rounded-md"
													priority
												/>
											</div>
										)}

										{/* Status and Ratings Section */}
										{placeDetails && (
											<div className="mb-3 p-3 bg-gray-50 rounded-md">
												<div className="flex justify-between items-center mb-2">
													{placeDetails.isOpenNow !== null && (
														<span
															className={`text-sm font-medium ${
																placeDetails.isOpenNow
																	? "text-green-600"
																	: "text-red-600"
															}`}
														>
															{placeDetails.isOpenNow
																? "Open Now"
																: "Closed Now"}
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
										{displayNote && (
											<div className="mb-3">
												<div className="flex items-center gap-1.5 mb-1">
													<User className="h-3.5 w-3.5 text-muted-foreground" />
													<span className="text-xs font-medium text-muted-foreground">
														Note from contributor:
													</span>
												</div>
												<div className="text-sm text-foreground/90 bg-gray-50 p-3 rounded-md">
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

										{canDelete && (
											<Button
												variant="outline"
												size="sm"
												className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full"
												onClick={() => setShowDeleteDialog(true)}
											>
												<Trash2 className="h-4 w-4" />
												Delete Location
											</Button>
										)}

										<div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
											<Link
												href={`/maps/${map.slug || "map"}/submit`}
												className="flex-1"
											>
												<Button variant="default" size="sm" className="w-full">
													Add New Location
												</Button>
											</Link>
										</div>
									</>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Delete Location Dialog - works for both mobile and desktop */}
				{showDeleteDialog && selectedLocation && (
					<DeleteLocationDialog
						locationId={selectedLocation.id}
						locationName={selectedLocation.name}
						onDeleted={handleLocationDeleted}
						onCancel={() => setShowDeleteDialog(false)}
					/>
				)}
			</div>
		</>
	)
}

// Main component with Suspense boundary
export default function ClientMapPageContent(props: ClientMapPageContentProps) {
	return (
		<Suspense
			fallback={
				<div className="p-4">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
						<div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
						<div className="h-64 bg-gray-200 rounded mb-4"></div>
					</div>
				</div>
			}
		>
			<ClientMapPageContentInner {...props} />
		</Suspense>
	)
}
