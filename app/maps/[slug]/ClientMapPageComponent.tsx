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
	X,
} from "lucide-react"
import Image from "next/image"
import ShareButton from "@/components/custom-ui/ShareButton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Location } from "@/lib/types/mapTypes"
import { useUserInfo } from "@/lib/hooks/useUserInfo"

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
	const [isOpen, setIsOpen] = useState(false)
	const [isExiting, setIsExiting] = useState(false)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showFullNote, setShowFullNote] = useState(false)

	const [selectedLocation, setSelectedLocation] = useState<Location | null>(
		null
	)

	const { userInfo, fetchUserInfo } = useUserInfo()
	const { user: authUser } = useUser()

	const handleCollapse = () => {
		setIsExiting(true)
		setTimeout(() => {
			setIsOpen(false)
			setIsExiting(false)
		}, 300) // Match the animation duration
	}

	const onMarkerClick = (location: Location) => {
		// If clicking the same marker, deselect it
		if (selectedLocation && selectedLocation.id === location.id) {
			setSelectedLocation(null)
			return
		}

		setSelectedLocation(location)
		fetchUserInfo(location.creator_id)

		// Always open the bottom panel when a location is selected
		setIsOpen(true)
	}



	const handleMapClick = () => {
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
	const MapContent = ({ isMobile = false }: { isMobile?: boolean }) => (
		<div className="flex flex-col h-full">
			{!selectedLocation ? (
				<>
					<div className={`flex items-center justify-between p-4 pb-2 ${isMobile ? 'hidden' : ''}`}>
						<div className="flex-shrink-0">
							{user && user.id === map.owner_id && (
								<Link href={`/maps/${map.slug || "map"}/edit`}>
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-1 h-8"
									>
										<Edit className="h-3.5 w-3.5" />
										Edit
									</Button>
								</Link>
							)}
						</div>
						<div className="flex items-center gap-2">
							<ShareButton
								mapId={map.id}
								slug={map.slug}
								title={map.title}
								description={map.description}
								image={map.image}
							/>
						</div>
					</div>

					<div className={`px-4 pb-4 overflow-y-auto flex-1 ${isMobile ? 'pt-0' : ''}`}>
						{!isMobile && (
							<h1 className="text-2xl font-bold text-gray-900 mb-2">
								{map.title}
							</h1>
						)}

						<div className="flex items-center gap-2 mb-4 mt-2">
							<Link href={`/maps/${map.slug || "map"}/submit`} className="flex-1">
								<Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
									Contribute
								</Button>
							</Link>
						</div>

						<div className="space-y-3 mb-6">
							<p className="text-sm text-gray-600 leading-relaxed">
								{map.description}
							</p>
						</div>

						<div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
							<Avatar className="h-8 w-8 border border-gray-200">
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
								<span className="font-medium text-gray-900">{map.username}</span>
							</span>
						</div>

						<div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-6">
							<UpvoteButton
								mapId={map.id}
								initialUpvotes={map.upvotes}
								initialIsUpvoted={map.hasUpvoted}
								variant="pill"
							/>
							<span className="flex items-center bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
								<MapPin className="inline mr-1 h-3 w-3" />
								{approvedLocationsCount} locations
							</span>
							<span className="flex items-center bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
								<Users className="inline mr-1 h-3 w-3" />
								{map.contributors} contributors
							</span>
						</div>

						<div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden border border-gray-100">
							<Image
								src={map.image}
								alt={map.title}
								fill
								className="object-cover"
							/>
						</div>

						<div className="prose prose-sm max-w-none text-gray-600">
							<Markdown content={map.body} />
						</div>
					</div>
				</>
			) : userInfo ? (
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
							<div className="flex items-start gap-3 mb-3">
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
						)}

						<div className="flex items-center gap-3 mb-6 text-sm text-gray-500">
							<Avatar className="h-8 w-8 border border-gray-200">
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
							<div className="flex flex-col">
								<span className="text-xs text-gray-400">Added by</span>
								<span className="font-medium text-gray-900">
									{userInfo.username}
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
						<div className={`flex gap-2 pb-safe ${isMobile ? 'mt-4' : 'mt-auto'}`}>
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
					</div>
				</>
			) : (
				<div className="flex items-center justify-center h-full">
					<LoadingIndicator message="Loading location details..." />
				</div>
			)}
		</div>
	)

	return (
		<>
			<div className="relative flex flex-col h-[calc(100vh-72px)] w-full overflow-hidden bg-gray-50">
				{/* Map Layer - Absolute & Full Screen */}
				<div className="absolute inset-0 z-0">
					<OSMMap
						locations={map.locations}
						selectedLocation={selectedLocation}
						onMarkerClick={onMarkerClick}
					/>
				</div>

				{/* Desktop Floating Sidebar */}
				<div className="hidden md:flex absolute top-4 left-4 bottom-4 w-[400px] z-10 flex-col">
					<div className="flex-1 bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col backdrop-blur-sm bg-white/95 supports-[backdrop-filter]:bg-white/80">
						<MapContent />
					</div>
				</div>

				{/* Mobile Layout - Single Expanding Bottom Sheet */}
				<div className="md:hidden absolute inset-0 pointer-events-none z-10">
					<div
						className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pointer-events-auto flex flex-col max-h-[60vh] h-auto transition-all duration-300 ease-in-out"
					>
						{/* Header - Always visible and clickable to toggle */}
						<div
							className="bg-white rounded-t-2xl border-b border-gray-100 cursor-pointer"
							onClick={() => setIsOpen(!isOpen)}
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
											<button
												className="p-1.5 rounded-full hover:bg-gray-100 transition-colors -mt-1 -mr-1 shrink-0"
												onClick={(e) => {
													e.stopPropagation()
													setIsOpen(true)
												}}
											>
												<ChevronUp className="h-5 w-5 text-gray-500" />
											</button>
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
												<span>{map.contributors}</span>
											</div>
										</div>

										{/* Contribute Button */}
										<Link
											href={`/maps/${map.slug || "map"}/submit`}
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												size="sm"
												className="w-full h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm"
											>
												Contribute
											</Button>
										</Link>
									</div>
								</div>
							) : (
								// Simple Header for Expanded View or Selected Location
								<div className="p-4 flex items-center justify-between gap-2">
									<div className="flex flex-col flex-1 min-w-0">
										<h1 className="text-lg font-bold tracking-tight text-gray-900 line-clamp-2">
											{selectedLocation ? selectedLocation.name : map.title}
										</h1>
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

										{user && user.id === map.owner_id && (
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
								</div>
							)}
						</div>

						{/* Content - Visible when expanded */}
						<div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}>
							<div className="overflow-y-auto max-h-[55vh]">
								<MapContent isMobile={true} />
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
