"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Markdown } from "@/components/markdown/MarkdownRenderer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
	MapPin,
	Users,
	ChevronUp,
	ChevronDown,
	Edit,
	User,
	ExternalLink,
	Trash2,
	X,
	ArrowUpDown,
	Info,
	Plus,
	Share2,
	UserPlus,
} from "lucide-react"
import { LocationCard } from "@/components/map/LocationCard"
import { MapDetailsDialog } from "@/components/map/MapDetailsDialog"
import Image from "next/image"
import ShareButton from "@/components/custom-ui/ShareButton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Location, MapUI, Contributor } from "@/lib/types/mapTypes"
import { CollaboratorAvatars } from "@/components/custom-ui/CollaboratorAvatars"
import { InviteCollaboratorDialog } from "@/components/map/InviteCollaboratorDialog"

const OSMMap = dynamic(() => import("@/components/map/OSMMap"), {
	ssr: false,
	loading: () => <LoadingIndicator message="Loading map..." />,
})
import { UpvoteButton } from "@/components/custom-ui/UpvoteButton"
import { LocationUpvoteButton } from "@/components/map/LocationUpvoteButton"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/components/layout/LayoutClient"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import DeleteLocationDialog from "@/components/map/DeleteLocationDialog"
import { Suspense } from "react"
import { getLocationDetailsAction } from "@/lib/supabase/api/getLocationDetailsAction"
import { useUserLocation } from "@/lib/context/UserLocationContext"
import { calculateDistance, formatDistance } from "@/lib/utils/distance"
import { useToast } from "@/lib/hooks/use-toast"



interface ClientMapPageContentProps {
	map: MapUI
	initialIsUpvoted?: boolean
	user?: any
	searchParams?: { [key: string]: string | string[] | undefined }
}



// Component that uses useSearchParams
function ClientMapPageContentInner({
	map: initialMap,
	initialIsUpvoted = false,
	user,
	searchParams,
}: ClientMapPageContentProps) {
	const searchParamsObj = useSearchParams()
	const shouldExpand =
		searchParams?.expand === "true" || searchParamsObj.get("expand") === "true"
	const [isOpen, setIsOpen] = useState(false)
	const [isExiting, setIsExiting] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showFullNote, setShowFullNote] = useState(false)

	const [selectedLocation, setSelectedLocation] = useState<Location | null>(
		null
	)
	const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null)
	const [isLoadingLocation, setIsLoadingLocation] = useState(false)
	const [sortBy, setSortBy] = useState<"upvotes" | "distance">("upvotes")
	const [showMapDetails, setShowMapDetails] = useState(false)
	const [showInviteDialog, setShowInviteDialog] = useState(false)

	// Manage map data in state so we can update it when locations are deleted
	const [map, setMap] = useState<MapUI>(initialMap)

	const { user: authUser } = useUser()
	const { toast } = useToast()

	// Use global location context
	const { latitude: userLat, longitude: userLng } = useUserLocation()

	// Track current location being fetched to prevent stale closure updates
	const fetchAbortControllerRef = useRef<AbortController | null>(null)
	const currentLocationIdRef = useRef<string | null>(null)

	// Sort locations
	const sortedLocations = useMemo(() => {
		let locations: Location[] = [...map.locations]

		// Calculate distance if user location is available
		if (userLat !== null && userLng !== null) {
			locations = locations.map((location): Location => ({
				...location,
				distance: calculateDistance(
					userLat,
					userLng,
					location.latitude,
					location.longitude
				),
			}))
		}

		if (sortBy === "distance" && userLat !== null && userLng !== null) {
			return locations.sort((a, b) => (a.distance || 0) - (b.distance || 0))
		}

		// Default sort by upvotes
		return locations.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
	}, [map.locations, userLat, userLng, sortBy])

	// Get distance for selected location from sortedLocations (reuse upfront calculation)
	const selectedLocationDistance = useMemo(() => {
		if (!selectedLocation || userLat === null || userLng === null) return null
		const locationWithDistance = sortedLocations.find(loc => loc.id === selectedLocation.id) as (Location & { distance?: number }) | undefined
		return locationWithDistance?.distance ?? null
	}, [selectedLocation, sortedLocations, userLat, userLng])

	// Stable handlers for hover events to prevent LocationCard re-renders
	const handleMouseEnter = useCallback((id: string) => {
		setHoveredLocationId(id)
	}, [])

	const handleMouseLeave = useCallback(() => {
		setHoveredLocationId(null)
	}, [])

	const handleCollapse = () => {
		setIsExiting(true)
		setTimeout(() => {
			setIsOpen(false)
			setIsExiting(false)
		}, 300) // Match the animation duration
	}

	const handleShareMap = async () => {
		const url = `${window.location.origin}/maps/${map.slug}`
		try {
			await navigator.clipboard.writeText(url)
			toast({
				title: "Link Copied!",
				description: "The map URL has been copied to your clipboard.",
				duration: 3000,
			})
		} catch (err) {
			toast({
				title: "Failed to Copy",
				description: "Couldn't copy the URL. Please try again.",
				variant: "destructive",
				duration: 3000,
			})
		}
	}

	const onMarkerClick = useCallback(async (location: Location) => {
		// If clicking the same marker, deselect it
		if (selectedLocation && selectedLocation.id === location.id) {
			setSelectedLocation(null)
			// Cancel any pending fetch
			if (fetchAbortControllerRef.current) {
				fetchAbortControllerRef.current.abort()
				fetchAbortControllerRef.current = null
			}
			currentLocationIdRef.current = null
			return
		}

		// Cancel any previous pending request
		if (fetchAbortControllerRef.current) {
			fetchAbortControllerRef.current.abort()
		}

		// Set current location being fetched
		currentLocationIdRef.current = location.id
		fetchAbortControllerRef.current = new AbortController()

		// Set initial location data and open panel immediately for fast UI
		// These are batched together to prevent the note from flashing
		setSelectedLocation(location)
		setIsOpen(true)

		// Fetch fresh location details in the background (only for upvotes/hasUpvoted if needed)
		// Note: We already have user info in the location object now
		setIsLoadingLocation(true)
		try {
			const result = await getLocationDetailsAction(location.id)
			// Only update state if this is still the current location and request wasn't aborted
			if (currentLocationIdRef.current === location.id && !fetchAbortControllerRef.current?.signal.aborted && result.success && result.data) {
				// Merge the fresh data but preserve the user info from the list
				setSelectedLocation(prev => prev ? ({
					...prev,
					...result.data,
					user_username: prev.user_username,
					user_avatar: prev.user_avatar
				} as Location) : null)
			}
		} catch (error) {
			// Ignore errors from aborted requests
			if (error instanceof Error && error.name !== 'AbortError') {
				console.error("Error fetching location details:", error)
			}
		} finally {
			// Only clear loading if this is still the current location
			if (currentLocationIdRef.current === location.id) {
				setIsLoadingLocation(false)
			}
		}
	}, [selectedLocation])



	const handleMapClick = () => {
		setSelectedLocation(null)
		// Don't close the panel on map click, just deselect the location
	}

	const handleLocationDeleted = (deletedLocationId: string) => {
		// Update map state by filtering out the deleted location
		setMap((prevMap) => ({
			...prevMap,
			locations: prevMap.locations.filter((loc) => loc.id !== deletedLocationId),
		}))
		setSelectedLocation(null)
		setShowDeleteDialog(false)
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

	// Cleanup pending requests on unmount
	useEffect(() => {
		return () => {
			if (fetchAbortControllerRef.current) {
				fetchAbortControllerRef.current.abort()
			}
		}
	}, [])



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



	// Unified content for both desktop and mobile
	// Unified content for both desktop and mobile
	const renderMapContent = (isMobile = false) => (
		<div className="flex flex-col h-full">
			{!selectedLocation ? (
				<>
					<>
						{/* List View Header */}
						<div className="flex flex-col gap-4 p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
							{/* Map Header Info */}
							<div className={`flex gap-4 ${isMobile ? 'hidden' : ''}`}>
								<div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-100">
									<Image
										src={map.image}
										alt={map.title}
										fill
										className="object-cover"
									/>
								</div>
								<div className="flex flex-col flex-1 min-w-0 justify-between py-1">
									<div>
										<h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight line-clamp-2">
											{map.title}
										</h1>

										{/* User Info Line */}
										<div className="flex items-center gap-2.5 mt-2 text-xs text-gray-500">
											<CollaboratorAvatars contributors={map.contributors} size="sm" />
											{map.contributors.length > 0 && (
												<span className="truncate max-w-[calc(100%-60px)]">
													<span className="font-medium text-gray-900">
														{map.contributors.find(c => c.is_owner)?.full_name || "Unknown User"}
													</span>
													{map.contributors.filter(c => !c.is_owner).length > 0 && (
														<>
															{" "}
															&bull; {map.contributors.filter(c => !c.is_owner).length} collaborators
														</>
													)}
												</span>
											)}
										</div>

										{/* Stats Line */}
										<div className="flex items-center gap-2 mt-2">
											<UpvoteButton
												mapId={map.id}
												initialUpvotes={map.upvotes}
												initialIsUpvoted={map.hasUpvoted}
												variant="pill"
												className="h-6 px-2 py-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-500"
											/>
											<span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 text-xs text-gray-500 h-6">
												<MapPin className="h-3 w-3" />
												{approvedLocationsCount}
											</span>
											<span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 text-xs text-gray-500 h-6">
												<Users className="h-3 w-3" />
												{map.contributors.length}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2 mt-2 flex-wrap">
										<button
											onClick={() => setShowMapDetails(true)}
											className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
										>
											<Info className="h-3 w-3" />
											More info
										</button>
										{user && user.id === map.owner_id && (
											<Link
												href={`/maps/${map.slug}/edit`}
												className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
											>
												<Edit className="h-3 w-3" />
												Edit
											</Link>
										)}
										{user && user.id === map.owner_id && (
											<button
												onClick={() => setShowInviteDialog(true)}
												className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
											>
												<UserPlus className="h-3 w-3" />
												Invite
											</button>
										)}
										<Link
											href={`/maps/${map.slug}/submit`}
											className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
										>
											<Plus className="h-3 w-3" />
											{user && (user.id === map.owner_id || map.contributors.some(c => c.id === user.id && !c.is_owner))
												? "Add location"
												: "Suggest location"}
										</Link>
										<button
											onClick={handleShareMap}
											className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
										>
											<Share2 className="h-3 w-3" />
											Share
										</button>
									</div>
								</div>
							</div>

							{/* Sort Controls */}
							<div className="flex items-center justify-between pt-1">
								<h2 className="font-semibold text-gray-900 text-sm">
									{map.locations.length} locations
								</h2>
								<div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
									<button
										onClick={() => setSortBy("upvotes")}
										className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${sortBy === "upvotes"
											? "bg-white text-gray-900 shadow-sm"
											: "text-gray-500 hover:text-gray-700"
											}`}
									>
										Top Rated
									</button>
									<button
										onClick={() => setSortBy("distance")}
										disabled={!userLat || !userLng}
										className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${sortBy === "distance"
											? "bg-white text-gray-900 shadow-sm"
											: "text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
											}`}
										title={!userLat || !userLng ? "Enable location to sort by distance" : ""}
									>
										Nearest
									</button>
								</div>
							</div>
						</div>

						{/* Location List */}
						<div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isMobile ? 'pt-0' : ''}`}>
							{sortedLocations.map((location: Location) => (
								<LocationCard
									key={location.id}
									location={location}
									onClick={onMarkerClick}
									isSelected={false}
									distance={location.distance}
									onMouseEnter={handleMouseEnter}
									onMouseLeave={handleMouseLeave}
								/>
							))}

							{sortedLocations.length === 0 && (
								<div className="text-center py-12 px-4">
									<div className="bg-gray-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
										<MapPin className="h-6 w-6 text-gray-400" />
									</div>
									<h3 className="text-gray-900 font-medium mb-1">No locations yet</h3>
									<p className="text-gray-500 text-sm mb-4">
										Be the first to add a location to this map!
									</p>
									<Link href={`/maps/${map.slug || "map"}/submit`}>
										<Button className="bg-blue-600 hover:bg-blue-700 text-white">
											Add Location
										</Button>
									</Link>
								</div>
							)}
						</div>
					</>
				</>
			) : (
				<>
					<div className={`flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-20 ${isMobile ? 'hidden' : ''}`}>
						<button
							onClick={() => setSelectedLocation(null)}
							className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
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
								image={map.image}
							/>
						</div>
					</div>

					<div className={`p-4 overflow-y-auto ${isMobile ? 'pt-0' : 'flex-1'}`}>
						{!isMobile && (
							<>
								<div className="flex items-start gap-3 mb-1">
									<h1 className="text-xl font-bold text-gray-900 flex-1">
										{selectedLocation.name}
									</h1>
									{canDelete && (
										<Button
											variant="outline"
											size="sm"
											className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 p-2"
											onClick={() => setShowDeleteDialog(true)}
											aria-label="Delete location"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
								{selectedLocationDistance !== null && (
									<p className="text-sm text-gray-500 mb-3">
										{formatDistance(selectedLocationDistance)} away
									</p>
								)}
							</>
						)}

						{isLoadingLocation && !selectedLocation.user_username ? (
							// Skeleton loading state - only if we somehow don't have basic info
							<>

								{/* Avatar skeleton */}
								<div className="flex items-center gap-3 mb-6">
									<div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
									<div className="flex flex-col gap-1.5 flex-1">
										<div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
										<div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
									</div>
								</div>

								{/* Note skeleton */}
								<div className="mb-6">
									<div className="flex items-center gap-2 mb-2">
										<div className="h-3.5 w-3.5 bg-gray-200 rounded animate-pulse" />
										<div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
									</div>
									<div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
										<div className="space-y-2">
											<div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
											<div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
											<div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
										</div>
									</div>
								</div>

								{/* Action buttons skeleton */}
								<div className={`flex gap-2 ${isMobile ? 'mt-4' : 'mt-auto'}`}>
									<div className="w-20 h-11 bg-gray-200 rounded-xl animate-pulse" />
									<div className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse" />
								</div>
							</>
						) : (
							<>
								<div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
									<Avatar className="h-8 w-8 border border-gray-200">
										{selectedLocation.user_avatar ? (
											<Image
												src={selectedLocation.user_avatar}
												alt={selectedLocation.user_username || "User"}
												fill
												className="object-cover rounded-full"
												sizes="32px"
											/>
										) : (
											<AvatarFallback>
												{(selectedLocation.user_username || "U")
													.split(" ")
													.map((n) => n[0])
													.join("")
													.toUpperCase()}
											</AvatarFallback>
										)}
									</Avatar>
									<div className="flex flex-col">
										<span className="text-xs text-gray-400">Suggested by</span>
										<span className="font-medium text-gray-900">
											{selectedLocation.user_username || "Unknown User"}
											<span className="text-gray-400 font-normal ml-1">
												• {formatDate(selectedLocation.created_at)}
											</span>
										</span>
									</div>
								</div>

								{/* Note Section */}
								{displayNote && (
									<div className="mb-6">
										<div className="flex items-center gap-2 mb-2">
											<User className="h-3.5 w-3.5 text-gray-400" />
											<span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												Note from contributor
											</span>
										</div>
										<div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
											<p className="break-words leading-relaxed">{displayNote}</p>
											{noteIsLong && (
												<button
													onClick={() => setShowFullNote(!showFullNote)}
													className="text-xs font-medium text-brand-orange mt-2 hover:text-brand-orange/80 transition-colors"
												>
													{showFullNote ? "Show less" : "Read more"}
												</button>
											)}
										</div>
									</div>
								)}

								{/* Action buttons */}
								<div className={`flex gap-2 ${isMobile ? 'mt-4' : 'mt-auto'}`}>
									<LocationUpvoteButton
										locationId={selectedLocation.id}
										initialUpvotes={selectedLocation.upvotes ?? 0}
										initialIsUpvoted={selectedLocation.hasUpvoted}
										variant="full"
										className="w-20 h-11 rounded-xl"
									/>
									<Link
										href={
											selectedLocation.google_maps_url.includes(
												"place/?q=place_id:"
											)
												? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
													selectedLocation.name
												)}&query_place_id=${selectedLocation.google_maps_url.split(
													"place_id:"
												)[1]
												}`
												: selectedLocation.google_maps_url.includes(
													"maps.google.com/?cid="
												)
													? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
														selectedLocation.name
													)}&query_place_id=${selectedLocation.google_maps_url.split("cid=")[1]
													}`
													: selectedLocation.google_maps_url
										}
										target="_blank"
										rel="noopener noreferrer"
										className="flex-1"
									>
										<Button
											className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
										>
											<ExternalLink className="h-4 w-4 mr-2" />
											View on Google Maps
										</Button>
									</Link>
								</div>
							</>
						)}
					</div>
				</>
			)}
		</div>
	)

	return (
		<>
			<div className="relative flex flex-col h-[calc(100dvh-72px)] w-full overflow-hidden bg-gray-50">
				{/* Map Layer - Absolute & Full Screen */}
				<div className="absolute inset-0 z-0">
					<OSMMap
						locations={sortedLocations}
						selectedLocation={selectedLocation}
						onMarkerClick={onMarkerClick}
						userLocation={
							userLat !== null && userLng !== null
								? { latitude: userLat, longitude: userLng }
								: undefined
						}
						hoveredLocationId={hoveredLocationId}
					/>

					{/* Map Info Bar - Desktop (Removed as per new design) */}
					{/* <div className="hidden md:block absolute bottom-6 right-6 z-[1000]">
						<MapInfoBar map={map} />
					</div> */}
				</div>

				{/* Map Details Dialog */}
				<MapDetailsDialog
					map={map}
					isOpen={showMapDetails}
					onOpenChange={setShowMapDetails}
				/>

				{/* Desktop Floating Sidebar */}
				<div className="hidden md:flex absolute top-4 left-4 bottom-4 w-[400px] z-10 flex-col">
					<div className="flex-1 bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col backdrop-blur-sm bg-white/95 supports-[backdrop-filter]:bg-white/80">
						{renderMapContent()}
					</div>
				</div>

				{/* Mobile Layout - Single Expanding Bottom Sheet */}
				<div className="md:hidden absolute inset-0 pointer-events-none z-10">
					<div
						className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pointer-events-auto flex flex-col transition-all duration-300 ease-in-out pb-safe ${isOpen && !selectedLocation ? 'h-full' : 'h-auto max-h-[60dvh]'}`}
						style={{ maxHeight: isOpen && !selectedLocation ? undefined : 'min(60dvh, calc(60vh - env(safe-area-inset-bottom)))' }}
					>
						{/* Header - Always visible and clickable to toggle */}
						<div
							className="bg-white rounded-t-2xl border-b border-gray-100 cursor-pointer shrink-0"
							onClick={() => !selectedLocation && setIsOpen(!isOpen)}
						>
							{!selectedLocation && !isOpen ? (
								// Rich Header for Collapsed Map Details
								<div className="p-4 flex gap-4">
									{/* Thumbnail Image */}
									<div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-100">
										<Image
											src={map.image}
											alt={map.title}
											fill
											className="object-cover"
										/>
									</div>

									{/* Content */}
									<div className="flex flex-col flex-1 min-w-0 justify-between">
										<div className="flex justify-between items-start gap-2">
											<div className="min-w-0">
												<h1 className="text-lg font-bold tracking-tight truncate text-gray-900 leading-tight">
													{map.title}
												</h1>
												<p className="text-sm text-gray-500 truncate mt-0.5">
													{map.description}
												</p>
											</div>
											<div className="flex items-center gap-1 -mt-1 -mr-1 shrink-0">
												<button
													className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
													onClick={(e) => {
														e.stopPropagation()
														setShowMapDetails(true)
													}}
												>
													<Info className="h-5 w-5 text-gray-500" />
												</button>
												<button
													className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
													onClick={(e) => {
														e.stopPropagation()
														setIsOpen(true)
													}}
												>
													<ChevronUp className="h-5 w-5 text-gray-500" />
												</button>
											</div>
										</div>

										{/* Metadata */}
										<div className="flex items-center gap-2 my-1.5">
											<div onClick={(e) => e.stopPropagation()}>
												<UpvoteButton
													mapId={map.id}
													initialUpvotes={map.upvotes}
													initialIsUpvoted={map.hasUpvoted}
													variant="pill"
													className="h-6 px-2 py-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-500"
												/>
											</div>
											<div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-500 h-6">
												<MapPin className="h-3.5 w-3.5" />
												<span>{approvedLocationsCount}</span>
											</div>
											<div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-500 h-6">
												<Users className="h-3.5 w-3.5" />
												<span>{map.contributors.length}</span>
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex items-center gap-2">
											<Link
												href={`/maps/${map.slug || "map"}/submit`}
												onClick={(e) => e.stopPropagation()}
												className="flex-1"
											>
												<Button
													size="sm"
													className="w-full h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm"
												>
													{user && (user.id === map.owner_id || map.contributors.some(c => c.id === user.id && !c.is_owner))
														? "Add location"
														: "Suggest location"}
												</Button>
											</Link>
											{user && user.id === map.owner_id && (
												<Button
													size="sm"
													onClick={(e) => {
														e.stopPropagation()
														setShowInviteDialog(true)
													}}
													className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm px-3"
												>
													<UserPlus className="h-3.5 w-3.5" />
												</Button>
											)}
											<Button
												size="sm"
												onClick={(e) => {
													e.stopPropagation()
													handleShareMap()
												}}
												className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm px-3"
											>
												<Share2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								</div>
							) : (
								// Simple Header for Expanded View or Selected Location
								<div className="p-4 flex items-center justify-between gap-2">
									{selectedLocation && (isLoadingLocation && !selectedLocation.user_username) ? (
										// Skeleton for loading state on mobile
										<>
											<div className="flex flex-col flex-1 min-w-0 gap-2">
												<div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
												{!isOpen && (
													<div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
												)}
											</div>
											<div className="flex items-center gap-1 shrink-0">
												<button
													className="p-2 rounded-full hover:bg-gray-100 transition-colors"
													onClick={(e) => {
														e.stopPropagation()
														setSelectedLocation(null)
														setIsOpen(false)
													}}
												>
													<X className="h-5 w-5 text-gray-500" />
												</button>
											</div>
										</>
									) : (
										<>
											<div className="flex flex-col flex-1 min-w-0">
												<h1 className="text-lg font-bold tracking-tight text-gray-900 line-clamp-2">
													{selectedLocation ? selectedLocation.name : map.title}
												</h1>
												{selectedLocation && selectedLocationDistance !== null && (
													<p className="text-sm text-gray-500 mt-0.5">
														{formatDistance(selectedLocationDistance)} away
													</p>
												)}
												{!isOpen && (
													<p className="text-sm text-gray-500 truncate mt-0.5">
														{selectedLocation
															? (selectedLocation.note || "Tap to see details")
															: map.description}
													</p>
												)}
											</div>

											<div className="flex items-center gap-1 shrink-0">
												{selectedLocation && canDelete && (
													<Button
														variant="ghost"
														size="sm"
														className="flex items-center gap-1 p-1 h-8 w-8 rounded-full text-red-600 hover:bg-red-50"
														onClick={(e) => {
															e.stopPropagation()
															setShowDeleteDialog(true)
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												)}

												{user && user.id === map.owner_id && !selectedLocation && (
													<Link
														href={`/maps/${map.slug || "map"}/edit`}
														onClick={(e) => e.stopPropagation()}
													>
														<Button
															variant="outline"
															size="sm"
															className="flex items-center gap-1 p-1 h-8 w-8 rounded-full"
														>
															<Edit className="h-4 w-4" />
														</Button>
													</Link>
												)}
												<button
													className="p-2 rounded-full hover:bg-gray-100 transition-colors"
													aria-label={
														selectedLocation
															? "Dismiss location"
															: isOpen
																? "Collapse panel"
																: "Expand panel"
													}
													onClick={(e) => {
														e.stopPropagation()
														if (selectedLocation) {
															setSelectedLocation(null)
															setIsOpen(false)
														} else {
															setIsOpen(!isOpen)
														}
													}}
												>
													{selectedLocation ? (
														<X className="h-5 w-5 text-gray-500" />
													) : isOpen ? (
														<ChevronDown className="h-5 w-5 text-gray-500" />
													) : (
														<ChevronUp className="h-5 w-5 text-gray-500" />
													)}
												</button>
											</div>
										</>
									)}
								</div>
							)}
						</div>

						{/* Content - Visible when expanded */}
						<div className={`overflow-hidden flex-1 transition-all duration-300 ease-in-out ${isOpen || selectedLocation ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
							<div className="h-full overflow-y-auto">
								{renderMapContent(true)}
							</div>
						</div>
					</div>
				</div>

				{/* Delete Location Dialog */}
				{showDeleteDialog && selectedLocation && (
					<DeleteLocationDialog
						locationId={selectedLocation.id}
						locationName={selectedLocation.name}
						onDeleted={handleLocationDeleted}
						onCancel={() => setShowDeleteDialog(false)}
					/>
				)}

				{/* Invite Collaborator Dialog */}
				{showInviteDialog && user && user.id === map.owner_id && (
					<InviteCollaboratorDialog
						mapId={map.id}
						isOpen={showInviteDialog}
						onOpenChange={setShowInviteDialog}
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
