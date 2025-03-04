"use client"

// components/CafeCard.tsx
import Image from "next/image"
import { MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils/utils"
import { UpvoteButton } from "./UpvoteButton"

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
}

export function CafeCard({
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
}: CafeCardProps) {
	return (
		<Card
			className={cn(
				"group w-full transition-all duration-300 hover:shadow-lg bg-card",
				"border border-border/50 hover:border-border/100 cursor-pointer",
				className
			)}
		>
			<CardHeader className="p-4 md:p-6 space-y-4 md:flex md:flex-row md:items-start md:gap-6 md:space-y-0">
				{/* Image Container */}
				<div className="relative w-full md:w-64 aspect-[16/10] overflow-hidden rounded-md shrink-0">
					<Image
						src={image || "/placeholder.svg"}
						alt={title}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						priority
					/>
				</div>

				{/* Content Container */}
				<div className="flex-1 space-y-2.5">
					<div className="space-y-1">
						<h3 className="font-semibold text-lg md:text-xl leading-tight tracking-tight text-foreground/90 group-hover:text-foreground">
							{title}
						</h3>
						<p className="text-sm text-muted-foreground/90 line-clamp-2">
							{description}
						</p>
					</div>

					<div className="flex flex-wrap gap-4">
						{/* Upvotes - Now first in the row */}
						<UpvoteButton
							mapId={mapId}
							initialUpvotes={upvotes}
							initialIsUpvoted={initialIsUpvoted}
							variant="text"
						/>
						<div className="flex items-center text-sm text-muted-foreground/75 transition-colors group-hover:text-muted-foreground">
							<MapPin className="mr-1.5 h-4 w-4" />
							{locations} locations
						</div>
						<div className="flex items-center text-sm text-muted-foreground/75 transition-colors group-hover:text-muted-foreground">
							<Users className="mr-1.5 h-4 w-4" />
							{contributors} contributors
						</div>
					</div>
				</div>
			</CardHeader>

			<CardFooter className="border-t border-border/50 px-4 py-3 md:px-6 md:py-4">
				<div className="flex items-center gap-2.5 text-sm text-muted-foreground/90">
					<Avatar className="h-6 w-6 border border-border/50">
						<AvatarImage src={userProfilePicture || "/placeholder.svg"} />
						<AvatarFallback>
							{username
								.split(" ")
								.map((n) => n[0])
								.join("")
								.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<span className="text-muted-foreground/75">
						Started by{" "}
						<span className="font-medium text-muted-foreground">
							{username}
						</span>
					</span>
				</div>
			</CardFooter>
		</Card>
	)
}
