"use client"

import { Heart } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useState, memo, useCallback } from "react"
import { toggleLocationUpvoteAction } from "@/lib/supabase/api/toggleLocationUpvoteAction"
import { useUser } from "@/components/layout/LayoutClient"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/hooks/use-toast"

interface LocationUpvoteButtonProps {
	locationId: string
	initialUpvotes: number
	initialIsUpvoted?: boolean
	variant?: "compact" | "full"
	className?: string
}

const HeartIcon = memo(({ className }: { className?: string }) => (
	<Heart className={className} />
))

export const LocationUpvoteButton = memo(function LocationUpvoteButton({
	locationId,
	initialUpvotes,
	initialIsUpvoted = false,
	variant = "compact",
	className,
}: LocationUpvoteButtonProps) {
	const [upvotes, setUpvotes] = useState(initialUpvotes)
	const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted)
	const [isLoading, setIsLoading] = useState(false)
	const [isAnimating, setIsAnimating] = useState(false)
	const { user } = useUser()
	const router = useRouter()
	const { toast } = useToast()

	const handleUpvote = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()

			if (!user) {
				toast({
					title: "Authentication required",
					description: "Please sign in to like locations",
					variant: "destructive",
				})
				router.push("/login")
				return
			}

			if (isLoading) return

			// Optimistic UI update
			const newUpvotedState = !isUpvoted
			setIsAnimating(true)
			setIsUpvoted(newUpvotedState)
			setUpvotes((prev) => (newUpvotedState ? prev + 1 : prev - 1))

			setTimeout(() => {
				setIsAnimating(false)
			}, 500)

			setIsLoading(true)

			try {
				const result = await toggleLocationUpvoteAction(locationId)

				if (!result.success) {
					// Revert on failure
					setIsUpvoted(!newUpvotedState)
					setUpvotes((prev) => (newUpvotedState ? prev - 1 : prev + 1))

					toast({
						title: "Error",
						description: result.error || "Failed to like location",
						variant: "destructive",
					})
				}
				// Don't refresh - let optimistic UI stay, actual value will show on next page load
			} catch (error) {
				// Revert on error
				setIsUpvoted(!newUpvotedState)
				setUpvotes((prev) => (newUpvotedState ? prev - 1 : prev + 1))

				console.error("Error upvoting location:", error)
				toast({
					title: "Error",
					description: "Something went wrong",
					variant: "destructive",
				})
			} finally {
				setIsLoading(false)
			}
		},
		[isLoading, isUpvoted, locationId, router, toast, user]
	)

	// Compact variant - horizontal layout like X/Twitter
	if (variant === "compact") {
		return (
			<button
				type="button"
				className={cn(
					"flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all",
					isUpvoted
						? "text-red-500 hover:bg-red-50"
						: "text-gray-500 hover:text-red-500 hover:bg-gray-100",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					isAnimating && "scale-110",
					className
				)}
				onClick={handleUpvote}
				disabled={isLoading}
				aria-label={isUpvoted ? "Unlike location" : "Like location"}
			>
				<HeartIcon
					className={cn(
						"h-4 w-4 transition-all",
						isUpvoted && "fill-current",
						isAnimating && "animate-pulse"
					)}
				/>
				<span
					className={cn(
						"text-sm font-medium tabular-nums",
						isAnimating && "animate-pulse"
					)}
				>
					{upvotes}
				</span>
			</button>
		)
	}

	// Full variant - horizontal layout
	return (
		<button
			type="button"
			className={cn(
				"flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
				isUpvoted
					? "bg-red-50 text-red-500"
					: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-500",
				isAnimating && "scale-110",
				"disabled:opacity-50 disabled:cursor-not-allowed",
				className
			)}
			onClick={handleUpvote}
			disabled={isLoading}
			aria-label={isUpvoted ? "Unlike location" : "Like location"}
		>
			<HeartIcon
				className={cn(
					"h-4 w-4 transition-all",
					isUpvoted && "fill-current"
				)}
			/>
			<span className={cn("text-sm font-medium tabular-nums", isAnimating && "animate-pulse")}>
				{upvotes}
			</span>
		</button>
	)
})
