"use client"

import { useState, useEffect, useRef } from "react"
import { Markdown } from "@/components/markdown/MarkdownRenderer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Users, ThumbsUp, ChevronUp, ChevronDown } from "lucide-react"
import Image from "next/image"
import ShareButton from "@/components/ShareButton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { useGoogleMaps, Location } from "@/lib/hooks/useGoogleMaps"
import { useUserInfo } from "@/lib/hooks/useUserInfo"
import LocationInfoWindow from "@/components/map/LocationInfoWindow"

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
}: ClientMapPageContentProps) {
	const [isOpen, setIsOpen] = useState(false)
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

	const handleCollapse = () => setIsOpen(false)

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
				<div className="hidden md:flex h-[calc(100vh-65px)]">
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
								zoomControl: true,
								clickableIcons: false,
							}}
						>
							{map.locations
								.filter((location) => location.is_approved) // Only show approved locations
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
									/>
								</InfoWindow>
							)}
						</GoogleMap>
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="md:hidden relative h-[calc(100vh-65px)]">
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
								zoomControl: true,
								clickableIcons: false,
							}}
						>
							{map.locations.map((location) => (
								<CustomMarker
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
									onCloseClick={handleInfoWindowClose}
								>
									<LocationInfoWindow
										location={selectedLocation}
										userInfo={userInfo}
										placeDetails={placeDetails}
										onClose={handleInfoWindowClose}
									/>
								</InfoWindow>
							)}
						</GoogleMap>
					</div>

					<div
						className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 cursor-pointer z-10 shadow-lg rounded-t-xl"
						onClick={() => setIsOpen(!isOpen)}
					>
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold truncate flex-1">
									{map.title}
								</h2>
								<div className="bg-gray-100 rounded-full p-1">
									<ChevronUp
										className={`h-5 w-5 transition-transform ${
											isOpen ? "rotate-180" : ""
										}`}
									/>
								</div>
							</div>
							<p className="text-muted-foreground text-sm truncate">
								{map.description}
							</p>
							<div className="flex gap-4 text-sm text-muted-foreground pt-1">
								<span className="flex items-center">
									<MapPin className="mr-1 h-4 w-4" />
									{map.locations.length}
								</span>
								<span className="flex items-center">
									<Users className="mr-1 h-4 w-4" />
									{map.contributors}
								</span>
								<span className="flex items-center">
									<ThumbsUp className="mr-1 h-4 w-4" />
									{map.upvotes}
								</span>
							</div>
						</div>
					</div>

					<div
						className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-transform duration-300 ease-in-out transform ${
							isOpen ? "translate-y-0" : "translate-y-full"
						} max-h-[80vh] overflow-y-auto z-20 rounded-t-xl shadow-lg`}
					>
						<div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
							<h1 className="text-xl font-bold tracking-tight truncate flex-1">
								{map.title}
							</h1>
							<button
								onClick={handleCollapse}
								className="p-2 rounded-full hover:bg-gray-100"
								aria-label="Collapse panel"
							>
								<ChevronDown className="h-5 w-5" />
							</button>
						</div>

						<div className="p-4 space-y-4">
							<div className="flex items-center gap-2 mb-4">
								<Link href={`/maps/${map.id}/submit`} className="flex-1">
									<Button variant="default" size="sm" className="w-full">
										Add Location
									</Button>
								</Link>
								<ShareButton mapId={map.id} />
							</div>

							<div className="space-y-4">
								<p className="text-muted-foreground">{map.description}</p>

								{/* Map creator info */}
								<div className="flex items-center gap-3 py-2">
									<Avatar className="h-10 w-10">
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
									<div>
										<p className="text-sm font-medium">
											Created by {map.username}
										</p>
										<div className="flex gap-3 text-xs text-muted-foreground">
											<span className="flex items-center">
												<Users className="inline mr-1 h-3 w-3" />
												{map.contributors}
											</span>
											<span className="flex items-center">
												<ThumbsUp className="inline mr-1 h-3 w-3" />
												{map.upvotes}
											</span>
										</div>
									</div>
								</div>

								{/* Map content */}
								<div className="prose prose-sm max-w-none">
									<Markdown content={map.body} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}
