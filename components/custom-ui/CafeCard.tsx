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
				"group w-full transition-all duration-300 bg-card overflow-hidden",
				"border border-border/50 hover:border-border/100 cursor-pointer",
				"rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-[1.01]",
				className
			)}
		>
			<div className="flex">
				{/* Voting Column - Reddit Style */}
				<div className="w-14 bg-gray-50/50 flex items-start justify-center pt-6 border-r border-border/30">
					<UpvoteButton
						mapId={mapId}
						initialUpvotes={upvotes}
						initialIsUpvoted={initialIsUpvoted}
						variant="reddit"
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1">
					<CardHeader className="p-4 md:p-6 space-y-4 md:flex md:flex-row md:items-start md:gap-6 md:space-y-0">
						{/* Image Container */}
						<div className="relative w-full md:w-48 aspect-[16/10] overflow-hidden rounded-xl shrink-0 bg-gray-100">
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
						<div className="flex-1 space-y-3">
							<div className="space-y-1.5">
								<h3 className="font-semibold text-xl leading-tight tracking-tight text-[#0F172A] group-hover:text-[#FF6A00] transition-colors">
									{title}
								</h3>
								<p className="text-sm text-[#64748B] line-clamp-2 leading-relaxed">
									{description}
								</p>
							</div>

							<div className="flex flex-wrap gap-2">
								{/* Pill-style metrics */}
								<div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs text-[#64748B] font-medium">
									<MapPin className="h-3.5 w-3.5" />
									<span>{locations}</span>
								</div>
								<div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-xs text-[#64748B] font-medium">
									<Users className="h-3.5 w-3.5" />
									<span>{contributors}</span>
								</div>
							</div>
						</div>
					</CardHeader>

					<CardFooter className="border-t border-border/40 px-4 py-3 md:px-6">
						<div className="flex items-center gap-2.5 text-sm">
							<Avatar className="h-6 w-6 border border-border/50">
								{userProfilePicture ? (
									<Image
										src={userProfilePicture}
										alt={username}
										fill
										className="object-cover rounded-full"
										sizes="24px"
									/>
								) : (
									<AvatarFallback className="text-xs">
										{username
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								)}
							</Avatar>
							<span className="text-[#64748B]">
								Started by{" "}
								<span className="font-medium text-[#0F172A]">
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
