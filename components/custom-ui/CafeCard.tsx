"use client"

// components/CafeCard.tsx
import Image from "next/image"
import { MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils/utils"
import { UpvoteButton } from "./UpvoteButton"
import { memo } from "react"

interface CafeCardProps {
	title: string
	description: string
	image: string
	locations: number
	contributors: number
	upvotes: number
	username: string
	userProfilePicture?: string | null
	className?: string
	mapId: string
	initialIsUpvoted?: boolean
	priority?: boolean
}

// Memoize the CafeCard component to prevent unnecessary re-renders
export const CafeCard = memo(function CafeCard({
	title,
	description,
	image,
	locations,
	contributors,
	upvotes,
	username,
	userProfilePicture,
	className,
	mapId,
	initialIsUpvoted,
	priority = false,
}: CafeCardProps) {
	// Use a placeholder for broken images
	const imageSrc = image || "/placeholder.svg"

	return (
		<Card
			className={cn(
				"group w-full bg-white overflow-hidden cursor-pointer",
				"hover:shadow-card-hover hover:scale-[1.01]",
				className
			)}
		>
			<div className="flex">
				{/* Voting Column - Reddit Style */}
				<div className="w-14 bg-gray-100 flex items-start justify-center pt-xl border-r border-gray-300">
					<UpvoteButton
						mapId={mapId}
						initialUpvotes={upvotes}
						initialIsUpvoted={initialIsUpvoted}
						variant="reddit"
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1">
					<CardHeader className="p-lg md:p-xl space-y-lg md:flex md:flex-row md:items-start md:gap-xl md:space-y-0">
						{/* Image Container - 16:9 ratio */}
						<div className="relative w-full md:w-48 aspect-[16/9] overflow-hidden rounded-image shrink-0 bg-gray-100">
							<Image
								src={imageSrc}
								alt={title}
								fill
								className="object-cover transition-transform duration-300 group-hover:scale-105"
								priority={priority}
								loading={priority ? "eager" : "lazy"}
								sizes="(max-width: 768px) 100vw, 192px"
								quality={75}
								onError={(e) => {
									// Fallback to placeholder if image fails to load
									const target = e.target as HTMLImageElement
									if (target.src !== "/placeholder.svg") {
										target.src = "/placeholder.svg"
									}
								}}
							/>
						</div>

						{/* Content Container */}
						<div className="flex-1 space-y-md">
							<div className="space-y-sm">
								<h3 className="text-h3 text-gray-900 group-hover:text-brand-orange transition-colors duration-200">
									{title}
								</h3>
								<p className="text-body-sm text-gray-500 line-clamp-2">
									{description}
								</p>
							</div>

							<div className="flex flex-wrap gap-sm">
								{/* Pill-style metrics */}
								<div className="flex items-center gap-sm px-md py-sm bg-gray-100 rounded-pill text-body-sm text-gray-500 font-medium">
									<MapPin className="h-4 w-4" />
									<span>{locations}</span>
								</div>
								<div className="flex items-center gap-sm px-md py-sm bg-gray-100 rounded-pill text-body-sm text-gray-500 font-medium">
									<Users className="h-4 w-4" />
									<span>{contributors}</span>
								</div>
							</div>
						</div>
					</CardHeader>

					<CardFooter className="border-t border-gray-300 px-lg py-md md:px-xl">
						<div className="flex items-center gap-sm text-body-sm">
							<Avatar className="h-6 w-6 border border-gray-300">
								{userProfilePicture ? (
									<Image
										src={userProfilePicture}
										alt={username}
										fill
										className="object-cover rounded-full"
										sizes="24px"
									/>
								) : (
									<AvatarFallback className="text-caption">
										{username
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								)}
							</Avatar>
							<span className="text-gray-500">
								Started by{" "}
								<span className="font-medium text-gray-900">
									{username}
								</span>
							</span>
						</div>
					</CardFooter>
				</div>
			</div>
		</Card>
	)
})
