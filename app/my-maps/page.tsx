"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { createClient } from "@/lib/supabase/service/client"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { getMapById } from "@/lib/supabase/maps"
import { MapPin, Users, ThumbsUp, Clock } from "lucide-react"
import { UserMap } from "@/lib/types/map"
import { usePendingCount } from "@/lib/context/PendingCountContext"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function MyMapsPage() {
	const { user } = useAuth()
	const [maps, setMaps] = useState<UserMap[]>([])
	const [loading, setLoading] = useState(true)
	const { refreshPendingCount } = usePendingCount()
	const supabase = createClient()

	useEffect(() => {
		if (!user) return

		const fetchMaps = async () => {
			try {
				// First, get all maps owned by the user
				const { data: userMaps, error } = await supabase
					.from("maps")
					.select("id")
					.eq("owner_id", user.id)

				if (error) {
					console.error("Error fetching maps:", error)
					setLoading(false)
					return
				}

				if (!userMaps.length) {
					setMaps([])
					setLoading(false)
					return
				}

				// Then, get detailed information for each map
				const mapsWithDetails = await Promise.all(
					userMaps.map(async (map) => {
						const { data: mapData, error: mapError } = await getMapById(map.id)

						if (mapError || !mapData) {
							console.error(`Error fetching map ${map.id}:`, mapError)
							return null
						}

						// Get pending submissions count
						const { count, error: countError } = await supabase
							.from("locations")
							.select("id", { count: "exact" })
							.eq("map_id", map.id)
							.eq("is_approved", false)

						if (countError) {
							console.error(
								`Error fetching pending count for map ${map.id}:`,
								countError
							)
						}

						return {
							...mapData,
							pendingCount: count || 0,
						}
					})
				)

				// Filter out any null results from failed fetches
				setMaps(mapsWithDetails.filter(Boolean) as UserMap[])

				// Refresh the global pending count
				refreshPendingCount()
			} catch (err) {
				console.error("Unexpected error fetching maps:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchMaps()
	}, [user])

	if (!user) {
		return (
			<main className="bg-gray-50/50 flex flex-col min-h-screen">
				<div className="container mx-auto px-4 py-8">
					<div className="text-center p-8 bg-white rounded-lg shadow-sm">
						<h2 className="text-xl font-semibold mb-2">Please Log In</h2>
						<p className="text-muted-foreground">
							You need to be logged in to view your maps
						</p>
					</div>
				</div>
			</main>
		)
	}

	if (loading) {
		return (
			<main className="bg-gray-50/50 flex flex-col min-h-screen">
				<div className="container mx-auto px-4 py-8">
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="bg-gray-50/50 flex flex-col min-h-screen">
			<div className="container mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold text-foreground">My Maps</h1>
					<Link href="/create-map">
						<Button>Create New Map</Button>
					</Link>
				</div>

				{maps.length === 0 ? (
					<div className="text-center p-8 bg-white rounded-lg shadow-sm">
						<h2 className="text-xl font-semibold mb-2">No Maps Yet</h2>
						<p className="text-muted-foreground mb-6">
							You haven't created any maps yet.
						</p>
						<Link href="/create-map">
							<Button>Create Your First Map</Button>
						</Link>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{maps.map((mapItem) => (
							<Card 
								key={mapItem.id} 
								className="overflow-hidden flex flex-col group hover:shadow-md transition-all duration-200"
							>
								<Link href={`/maps/${mapItem.id}`} className="flex-grow flex flex-col">
									<div className="relative h-48">
										<Image
											src={mapItem.image}
											alt={mapItem.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-300"
										/>
										
										<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
											<div className="flex justify-between text-white text-xs">
												<span className="flex items-center gap-1">
													<MapPin className="h-3 w-3" />
													{mapItem.locations.filter((l) => l.is_approved).length} locations
												</span>
												<span className="flex items-center gap-1">
													<Users className="h-3 w-3" />
													{mapItem.contributors} contributors
												</span>
												<span className="flex items-center gap-1">
													<ThumbsUp className="h-3 w-3" />
													{mapItem.upvotes} upvotes
												</span>
											</div>
										</div>
										
										{mapItem.pendingCount > 0 && (
											<div className="absolute top-3 right-3">
												<Badge 
													variant="destructive" 
													className="flex items-center gap-1 shadow-md"
												>
													<Clock className="h-3 w-3" />
													{mapItem.pendingCount} pending
												</Badge>
											</div>
										)}
									</div>

									<CardHeader className="pb-2">
										<CardTitle className="text-xl group-hover:text-primary transition-colors">
											{mapItem.title}
										</CardTitle>
										<CardDescription className="line-clamp-2">
											{mapItem.description}
										</CardDescription>
									</CardHeader>

									<CardContent className="pb-2 flex-grow">
										<p className="text-sm text-muted-foreground line-clamp-3">
											{mapItem.body.replace(/\[.*?\]\(.*?\)/g, '').replace(/[#*_]/g, '')}
										</p>
									</CardContent>
								</Link>

								<CardFooter className="pt-2 flex gap-2 border-t border-border mt-auto">
									<div className="flex items-center gap-2 flex-grow">
										<Avatar className="h-6 w-6">
											{mapItem.userProfilePicture ? (
												<AvatarImage src={mapItem.userProfilePicture} alt={mapItem.username} />
											) : (
												<AvatarFallback>{mapItem.username.charAt(0).toUpperCase()}</AvatarFallback>
											)}
										</Avatar>
										<span className="text-xs text-muted-foreground">By you</span>
									</div>
									
									{mapItem.pendingCount > 0 ? (
										<Link href={`/my-maps/${mapItem.id}/pending`}>
											<Button 
												variant="default" 
												size="sm" 
												className="flex items-center gap-1"
											>
												<Clock className="h-3 w-3" />
												Review {mapItem.pendingCount}
											</Button>
										</Link>
									) : (
										<Link href={`/my-maps/${mapItem.id}/pending`}>
											<Button 
												variant="outline" 
												size="sm"
											>
												Manage
											</Button>
										</Link>
									)}
								</CardFooter>
							</Card>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
