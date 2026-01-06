"use client"

// components/CafeCard.tsx
import Image from "next/image"
import { MapPin, Users } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils/utils"
import { UpvoteButton } from "./UpvoteButton"
import { memo } from "react"
import { CollaboratorAvatars, Contributor } from "./CollaboratorAvatars"

interface CafeCardProps {
	title: string
	description: string
	image: string
	locations: number
	contributors: Contributor[]
	upvotes: number
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
				<div className="w-10 md:w-14 bg-gray-50/50 flex items-start justify-center pt-4 md:pt-6 border-r border-border/30 shrink-0">
					<UpvoteButton
						mapId={mapId}
						initialUpvotes={upvotes}
						initialIsUpvoted={initialIsUpvoted}
						variant="reddit"
						className="scale-90 md:scale-100"
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					<CardHeader className="p-4 md:p-6 flex flex-row items-start gap-3 md:gap-6">
						{/* Image Container */}
						<div className="relative w-24 h-24 md:w-48 md:h-auto md:aspect-[16/10] overflow-hidden rounded-xl shrink-0 bg-gray-100">
							<Image
								src={imageSrc}
								alt={title}
								fill
								className="object-cover transition-transform duration-300 group-hover:scale-105"
								priority={priority}
								loading={priority ? "eager" : "lazy"}
								sizes="(max-width: 768px) 96px, 192px"
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
						<div className="flex-1 space-y-2 md:space-y-3 min-w-0">
							<div className="space-y-1">
								<h3 className="font-semibold text-base md:text-xl leading-tight tracking-tight text-[#0F172A] group-hover:text-[#FF6A00] transition-colors line-clamp-2">
									{title}
								</h3>
								<p className="text-xs md:text-sm text-[#64748B] line-clamp-2 leading-relaxed hidden sm:block">
									{description}
								</p>
							</div>

							<div className="flex flex-wrap gap-2">
								{/* Pill-style metrics */}
								<div className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 bg-gray-50 rounded-full text-[10px] md:text-xs text-[#64748B] font-medium">
									<MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
									<span>{locations}</span>
								</div>
								<div className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 bg-gray-50 rounded-full text-[10px] md:text-xs text-[#64748B] font-medium">
									<Users className="h-3 w-3 md:h-3.5 md:w-3.5" />
									<span>{contributors.length}</span>
								</div>
							</div>
						</div>
					</CardHeader>

					<CardFooter className="border-t border-border/40 px-4 py-3 md:px-6">
						<div className="flex items-center gap-2.5 text-sm text-[#64748B]">
							<CollaboratorAvatars contributors={contributors} size="sm" />
							{contributors.length > 0 && (
								<span className="truncate max-w-[calc(100%-60px)]">
									<span className="font-medium text-[#0F172A]">
										{contributors.find(c => c.is_owner)?.full_name || "Unknown User"}
									</span>
									{contributors.filter(c => !c.is_owner).length > 0 && (
										<>
											{" "}
											&bull; {contributors.filter(c => !c.is_owner).length} collaborators
										</>
									)}
								</span>
							)}
						</div>
					</CardFooter>
				</div>
			</div>
		</Card>
	)
})
