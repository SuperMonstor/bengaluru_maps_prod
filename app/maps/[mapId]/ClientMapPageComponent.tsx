"use client"

import { useState, useEffect } from "react"
import { Markdown } from "@/components/markdown-renderer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
	MapPin,
	Users,
	ThumbsUp,
	ChevronUp,
	ChevronDown,
} from "lucide-react"
import Image from "next/image"
import ShareButton from "@/components/sharebutton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { useGoogleMaps, Location } from "@/lib/hooks/useGoogleMaps"
import { useUserInfo } from "@/lib/hooks/useUserInfo"
import LocationInfoWindow from "@/app/components/LocationInfoWindow"

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
				path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
				fillColor: "#4285F4",
				fillOpacity: 1,
				strokeWeight: 1,
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
		mapStyles 
	} = useGoogleMaps(map.locations)
	
	const { userInfo, fetchUserInfo } = useUserInfo()

	const handleCollapse = () => setIsOpen(false)

	const onMarkerClick = (location: Location) => {
		setSelectedLocation(location)
		fetchUserInfo(location.creator_id)
		fetchPlaceDetails(location.google_maps_url)
	}

	const handleMapClick = () => {
		setSelectedLocation(null)
		if (isOpen) setIsOpen(false)
	}

	useEffect(() => {
		if (!isLoaded || !mapRef.current) return;
		
		// Apply optimal zoom and bounds
		const bounds = new google.maps.LatLngBounds();
		map.locations.forEach(location => {
			bounds.extend({ lat: location.latitude, lng: location.longitude });
		});
		
		if (map.locations.length > 1) {
			mapRef.current.fitBounds(bounds, {
				padding: { top: 50, right: 50, bottom: 50, left: 50 }
			});
		} else if (map.locations.length === 1) {
			mapRef.current.setCenter({ 
				lat: map.locations[0].latitude, 
				lng: map.locations[0].longitude 
			});
			mapRef.current.setZoom(15);
		}
		
		// Ensure zoom stays within a reasonable range
		const listener = google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
			const currentZoom = mapRef.current?.getZoom();
			if (currentZoom && currentZoom < 10) mapRef.current?.setZoom(10);
			if (currentZoom && currentZoom > 15) mapRef.current?.setZoom(15);
		});
		
		return () => {
			google.maps.event.removeListener(listener);
		};
	}, [isLoaded, map.locations]);

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
								gestureHandling: 'greedy',
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
									onCloseClick={() => setSelectedLocation(null)}
								>
									<LocationInfoWindow
										location={selectedLocation}
										userInfo={userInfo}
										placeDetails={placeDetails}
										onClose={() => setSelectedLocation(null)}
									/>
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
								gestureHandling: 'greedy',
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
									onCloseClick={() => setSelectedLocation(null)}
								>
									<LocationInfoWindow
										location={selectedLocation}
										userInfo={userInfo}
										placeDetails={placeDetails}
										onClose={() => setSelectedLocation(null)}
									/>
								</InfoWindow>
							)}
						</GoogleMap>
					</div>

					<div className="fixed top-4 right-4 z-10 flex gap-2">
						<Link href={`/maps/${map.id}/submit`}>
							<Button variant="default" size="sm" className="shadow-md">
								Contribute
							</Button>
						</Link>
						<ShareButton mapId={map.id} />
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
