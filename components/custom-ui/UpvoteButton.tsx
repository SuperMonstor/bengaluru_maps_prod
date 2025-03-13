"use client"

import { ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useState, useEffect } from "react"
import { toggleUpvote, hasUserUpvoted } from "@/lib/supabase/votesService"
import { useAuth } from "@/lib/context/AuthContext"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/hooks/use-toast"

interface UpvoteButtonProps {
	mapId: string
	initialUpvotes: number
	initialIsUpvoted?: boolean
	className?: string
	variant?: "icon" | "text" | "pill"
}

export function UpvoteButton({
	mapId,
	initialUpvotes,
	initialIsUpvoted = false,
	className,
	variant = "icon",
}: UpvoteButtonProps) {
	const [upvotes, setUpvotes] = useState(initialUpvotes)
	const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted)
	const [isLoading, setIsLoading] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)
	const { user } = useAuth()
	const router = useRouter()
	const { toast } = useToast()

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

		// Update UI immediately for better responsiveness
		const newUpvotedState = !isUpvoted
		setIsAnimating(true)
		setIsUpvoted(newUpvotedState)
		setUpvotes((prev) => (newUpvotedState ? prev + 1 : prev - 1))

		// Reset animation after a delay
		setTimeout(() => {
			setIsAnimating(false)
		}, 500)

		setIsLoading(true)

		try {
			const result = await toggleUpvote(mapId, user.id)

			if (!result.success) {
				// Revert the optimistic update if the server request fails
				setIsUpvoted(!newUpvotedState)
				setUpvotes((prev) => (newUpvotedState ? prev - 1 : prev + 1))

				toast({
					title: "Error",
					description: result.error || "Failed to upvote",
					variant: "destructive",
				})
			}

			// Refresh the page data in the background
			router.refresh()
		} catch (error) {
			// Revert the optimistic update if there's an error
			setIsUpvoted(!newUpvotedState)
			setUpvotes((prev) => (newUpvotedState ? prev - 1 : prev + 1))

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

	if (variant === "pill") {
		return (
			<button
				type="button"
				className={cn(
					"flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors",
					isUpvoted
						? "bg-green-100 text-green-600"
						: "bg-gray-100 text-muted-foreground hover:bg-gray-200",
					isAnimating && "animate-pulse",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					className
				)}
				onClick={handleUpvote}
				disabled={isLoading}
			>
				<ThumbsUp
					className={cn("h-3.5 w-3.5", isUpvoted && "fill-green-500")}
				/>
				<span
					className={cn("text-sm font-medium", isAnimating && "animate-bounce")}
				>
					{upvotes}
				</span>
			</button>
		)
	}

	if (variant === "icon") {
		return (
			<div className={cn("flex flex-col items-center gap-1", className)}>
				<button
					type="button"
					className={cn(
						"h-8 w-8 rounded-full transition-colors flex items-center justify-center",
						isUpvoted
							? "text-green-500 hover:bg-green-50"
							: "text-muted-foreground hover:bg-primary/10 hover:text-primary",
						isAnimating && "animate-pulse",
						"disabled:opacity-50 disabled:cursor-not-allowed"
					)}
					onClick={handleUpvote}
					disabled={isLoading}
				>
					<ThumbsUp className={cn("h-4 w-4", isUpvoted && "fill-green-500")} />
				</button>
				<span
					className={cn(
						"text-sm font-medium",
						isUpvoted ? "text-green-500" : "text-muted-foreground",
						isAnimating && "animate-bounce"
					)}
				>
					{upvotes}
				</span>
			</div>
		)
	}

	return (
		<div
			className={cn("flex items-center text-sm cursor-pointer", className)}
			onClick={handleUpvote}
		>
			<ThumbsUp
				className={cn(
					"mr-1.5 h-4 w-4",
					isUpvoted
						? "text-green-500 fill-green-500"
						: "text-muted-foreground/75 group-hover:text-muted-foreground",
					isAnimating && "animate-pulse"
				)}
			/>
			<span
				className={cn(
					isUpvoted
						? "text-green-500"
						: "text-muted-foreground/75 group-hover:text-muted-foreground",
					isAnimating && "animate-bounce"
				)}
			>
				{upvotes} upvotes
			</span>
		</div>
	)
}
