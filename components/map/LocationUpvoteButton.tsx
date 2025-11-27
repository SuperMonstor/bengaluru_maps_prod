"use client"

import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useState, memo, useCallback } from "react"
import { toggleLocationUpvote } from "@/lib/supabase/locationVotesService"
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

const ChevronUpIcon = memo(({ className }: { className?: string }) => (
	<ChevronUp className={className} />
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
					description: "Please sign in to upvote",
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
				const result = await toggleLocationUpvote(locationId, user.id)

				if (!result.success) {
					// Revert on failure
					setIsUpvoted(!newUpvotedState)
					setUpvotes((prev) => (newUpvotedState ? prev - 1 : prev + 1))

					toast({
						title: "Error",
						description: result.error || "Failed to upvote",
						variant: "destructive",
					})
				}

				router.refresh()
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

	// Compact variant for info window - vertical layout
	if (variant === "compact") {
		return (
			<div className={cn("flex flex-col items-center gap-0.5", className)}>
				<button
					type="button"
					className={cn(
						"p-1.5 rounded transition-colors",
						isUpvoted
							? "text-[#FF6A00] hover:bg-orange-50"
							: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
						"disabled:opacity-50 disabled:cursor-not-allowed"
					)}
					onClick={handleUpvote}
					disabled={isLoading}
					aria-label={isUpvoted ? "Remove upvote" : "Upvote location"}
				>
					<ChevronUpIcon
						className={cn(
							"h-5 w-5",
							isAnimating && isUpvoted && "animate-bounce"
						)}
					/>
				</button>
				<span
					className={cn(
						"text-sm font-medium tabular-nums",
						isUpvoted ? "text-[#FF6A00]" : "text-gray-700",
						isAnimating && "animate-pulse"
					)}
				>
					{upvotes}
				</span>
			</div>
		)
	}

	// Full variant - horizontal layout
	return (
		<button
			type="button"
			className={cn(
				"flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors",
				isUpvoted
					? "bg-orange-100 text-[#FF6A00]"
					: "bg-gray-100 text-gray-600 hover:bg-gray-200",
				isAnimating && "animate-pulse",
				"disabled:opacity-50 disabled:cursor-not-allowed",
				className
			)}
			onClick={handleUpvote}
			disabled={isLoading}
		>
			<ChevronUpIcon
				className={cn("h-4 w-4", isUpvoted && "stroke-[#FF6A00]")}
			/>
			<span className={cn("text-sm font-medium", isAnimating && "animate-bounce")}>
				{upvotes}
			</span>
		</button>
	)
})
