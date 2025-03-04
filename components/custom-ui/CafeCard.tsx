"use client"

// components/CafeCard.tsx
import Image from "next/image"
import { ThumbsUp, MapPin, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/utils"
import { useState, useEffect } from "react"
import { toggleUpvote, hasUserUpvoted } from "@/lib/supabase/votesService"
import { useAuth } from "@/lib/context/AuthContext"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/hooks/use-toast"

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
	upvotes: initialUpvotes,
	username,
	userProfilePicture,
	className,
	mapId,
	initialIsUpvoted,
}: CafeCardProps) {
	const [upvotes, setUpvotes] = useState(initialUpvotes)
	const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted || false)
	const [isLoading, setIsLoading] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)
	const { user } = useAuth()
	const router = useRouter()
	const { toast } = useToast()

	// Check if the user has already upvoted this map
	useEffect(() => {
		const checkUserUpvote = async () => {
			if (user && mapId && initialIsUpvoted === undefined) {
				try {
					const hasUpvoted = await hasUserUpvoted(mapId, user.id)
					setIsUpvoted(hasUpvoted)
				} catch (error) {
					console.error("Error checking if user has upvoted:", error)
				}
			}
		}

		checkUserUpvote()
	}, [user, mapId, initialIsUpvoted])

	const handleUpvote = async (e: React.MouseEvent) => {
		e.preventDefault() // Prevent navigation if button is inside a link
		e.stopPropagation() // Prevent event bubbling

		if (!user) {
			toast({
				title: "Authentication required",
				description: "Please sign in to upvote",
				variant: "destructive",
			})
			router.push("/login")
			return
		}

		if (isLoading) return

		setIsLoading(true)

		try {
			const result = await toggleUpvote(mapId, user.id)

			if (result.success) {
				setIsAnimating(true)

				if (result.isUpvoted) {
					setUpvotes((prev) => prev + 1)
					setIsUpvoted(true)
					toast({
						title: "Success",
						description: "Upvoted!",
					})
				} else {
					setUpvotes((prev) => prev - 1)
					setIsUpvoted(false)
					toast({
						title: "Success",
						description: "Upvote removed",
					})
				}

				// Refresh the page data
				router.refresh()

				// Reset animation after a delay
				setTimeout(() => {
					setIsAnimating(false)
				}, 500)
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to upvote",
					variant: "destructive",
				})
			}
		} catch (error) {
			console.error("Error upvoting:", error)
			toast({
				title: "Error",
				description: "Something went wrong",
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card
			className={cn(
				"group w-full transition-all duration-300 hover:shadow-lg bg-card",
				"border border-border/50 hover:border-border/100 cursor-pointer",
				className
			)}
		>
			<CardHeader className="p-4 md:p-6 space-y-4 md:flex md:flex-row md:items-start md:gap-6 md:space-y-0">
				{/* Upvote Button (Desktop only, Mobile moves upvotes below) */}
				<div className="hidden md:flex flex-col items-center gap-1 shrink-0">
					<Button
						variant={isUpvoted ? "default" : "ghost"}
						size="icon"
						className={cn(
							"h-8 w-8 rounded-full transition-colors",
							isUpvoted
								? "bg-primary text-primary-foreground"
								: "hover:bg-primary/10 hover:text-primary",
							isAnimating && "animate-pulse"
						)}
						onClick={handleUpvote}
						disabled={isLoading}
					>
						<ThumbsUp className="h-4 w-4" />
					</Button>
					<span
						className={cn(
							"text-sm font-medium text-muted-foreground",
							isAnimating && "animate-bounce"
						)}
					>
						{upvotes}
					</span>
				</div>

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
						<div className="flex items-center text-sm text-muted-foreground/75 transition-colors group-hover:text-muted-foreground">
							<MapPin className="mr-1.5 h-4 w-4" />
							{locations} locations
						</div>
						<div className="flex items-center text-sm text-muted-foreground/75 transition-colors group-hover:text-muted-foreground">
							<Users className="mr-1.5 h-4 w-4" />
							{contributors} contributors
						</div>
						{/* Upvotes on Mobile */}
						<div
							className="flex md:hidden items-center text-sm text-muted-foreground/75 transition-colors group-hover:text-muted-foreground cursor-pointer"
							onClick={handleUpvote}
						>
							<ThumbsUp
								className={cn(
									"mr-1.5 h-4 w-4",
									isUpvoted && "text-primary",
									isAnimating && "animate-pulse"
								)}
							/>
							<span className={cn(isAnimating && "animate-bounce")}>
								{upvotes} upvotes
							</span>
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
