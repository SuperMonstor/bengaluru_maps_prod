"use client"

import { useState, useEffect, useRef } from "react"
import { Markdown } from "@/components/markdown/MarkdownRenderer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Users, ChevronUp, ChevronDown, Edit } from "lucide-react"
import Image from "next/image"
import ShareButton from "@/components/custom-ui/ShareButton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { useGoogleMaps, Location } from "@/lib/hooks/useGoogleMaps"
import { useUserInfo } from "@/lib/hooks/useUserInfo"
import LocationInfoWindow from "@/components/map/LocationInfoWindow"
import { UpvoteButton } from "@/components/custom-ui/UpvoteButton"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"

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

const CustomMarker = ({ position, onClick }: any) => {
	return (
		<Marker
			position={position}
			onClick={onClick}
			icon={{
				path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
				fillColor: "#E53935",
				fillOpacity: 1,
				strokeWeight: 2,
				strokeColor: "#FFFFFF",
				scale: 1.5,
				anchor: new google.maps.Point(12, 22),
			}}
		/>
	)
}

export default function ClientMapPageContent({
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
	const { user: authUser } = useAuth()

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
		setSelectedLocation(location)
		fetchUserInfo(location.creator_id)
		fetchPlaceDetails(location.google_maps_url)
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

	const handleMapClick = () => {
		setSelectedLocation(null)
		if (isOpen) setIsOpen(false)
	}

	const handleLocationDeleted = () => {
		setSelectedLocation(null)
		window.location.reload()
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

	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-64px)] w-full">
				<LoadingIndicator message="Loading map details..." />
			</div>
		)
	}

	return (
		<>
			<style>{popupStyles}</style>
			<div className="flex flex-col h-[calc(100vh-64px)] w-full">
				{/* Desktop Layout */}
				<div className="hidden md:flex h-full w-full">
					<div className="w-2/5 max-w-[500px] p-4 md:p-8 lg:p-12 space-y-6 overflow-y-auto bg-white">
						<div className="flex items-center gap-4 justify-between">
							<h1 className="text-3xl font-bold tracking-tight text-foreground">
								{map.title}
							</h1>
							<div className="flex items-center gap-2 flex-shrink-0">
								{user && user.id === map.owner_id && (
									<Link href={`/maps/${map.slug || "map"}/${map.id}/edit`}>
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
								<Link href={`/maps/${map.slug || "map"}/${map.id}/submit`}>
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
									/>
								))}
							{selectedLocation && userInfo && (
								<InfoWindow
									position={{
										lat: selectedLocation.latitude,
										lng: selectedLocation.longitude,
									}}
									onCloseClick={handleInfoWindowClose}
								>
									<LocationInfoWindow
										location={selectedLocation}
										userInfo={userInfo}
										placeDetails={placeDetails}
										onClose={handleInfoWindowClose}
										currentUser={user}
										mapOwnerId={map.owner_id || ""}
										onLocationDeleted={handleLocationDeleted}
									/>
								</InfoWindow>
							)}
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
									/>
								))}
							{selectedLocation && userInfo && (
								<InfoWindow
									position={{
										lat: selectedLocation.latitude,
										lng: selectedLocation.longitude,
									}}
									onCloseClick={handleInfoWindowClose}
								>
									<LocationInfoWindow
										location={selectedLocation}
										userInfo={userInfo}
										placeDetails={placeDetails}
										onClose={handleInfoWindowClose}
										currentUser={user}
										mapOwnerId={map.owner_id || ""}
										onLocationDeleted={handleLocationDeleted}
									/>
								</InfoWindow>
							)}
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
										{map.title}
									</h2>
									<div className="flex items-center gap-2">
										{user && user.id === map.owner_id && (
											<Link
												href={`/maps/${map.slug || "map"}/${map.id}/edit`}
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
									{map.description}
								</p>
								<div className="flex gap-4 text-sm text-muted-foreground pt-1">
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
								</div>
							</div>
						</div>
					)}

					{/* Expanded panel - only shown when expanded */}
					{isOpen && (
						<div
							className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 h-[75vh] overflow-y-auto ${
								isExiting ? "animate-slide-down" : "animate-slide-up"
							}`}
						>
							<div className="sticky top-0 bg-white p-4 border-b border-gray-100">
								<div className="flex items-center justify-between">
									<h1 className="text-xl font-bold tracking-tight truncate flex-1">
										{map.title}
									</h1>
									<div className="flex items-center gap-2">
										{user && user.id === map.owner_id && (
											<Link
												href={`/maps/${map.slug || "map"}/${map.id}/edit`}
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

								<div className="flex items-center gap-3 mt-3">
									<Avatar className="h-8 w-8">
										{map.userProfilePicture ? (
											<AvatarImage
												src={map.userProfilePicture}
												alt={map.username}
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
							</div>

							<div className="p-4 space-y-4 pb-safe">
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

								<div className="flex items-center gap-2">
									<Link
										href={`/maps/${map.slug || "map"}/${map.id}/submit`}
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

								{/* Map content */}
								<div className="prose prose-sm max-w-none mt-4 pt-4 border-t border-gray-100">
									<Markdown content={map.body} />
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
