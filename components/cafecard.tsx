import Image from "next/image"
import { ThumbsUp, MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
}: CafeCardProps) {
	return (
		<Card
			className={cn(
				"group w-full transition-all duration-300 hover:shadow-lg bg-card",
				"border border-border/50 hover:border-border/100 cursor-pointer",
				className
			)}
		>
			<CardHeader className="flex flex-row items-start gap-6 space-y-0 p-6">
				{/* Upvote Button */}
				<div className="flex flex-col items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
					>
						<ThumbsUp className="h-4 w-4" />
					</Button>
					<span className="text-sm font-medium text-muted-foreground">
						{upvotes}
					</span>
				</div>

				{/* Image Container */}
				<div className="relative aspect-[16/10] w-64 overflow-hidden rounded-md">
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
						<h3 className="font-semibold text-xl leading-tight tracking-tight text-foreground/90 group-hover:text-foreground">
							{title}
						</h3>
						<p className="text-sm text-muted-foreground/90 line-clamp-2">
							{description}
						</p>
					</div>

					<div className="flex gap-4">
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

			<CardFooter className="border-t border-border/50 px-6 py-4">
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
