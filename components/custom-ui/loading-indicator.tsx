import { memo } from "react"

// Memoize the LoadingIndicator to prevent unnecessary re-renders
export const LoadingIndicator = memo(function LoadingIndicator({
	message = "Loading content...",
}: {
	message?: string
}) {
	return (
		<div className="min-h-[200px] rounded-md bg-white flex flex-col items-center justify-center p-6 space-y-4">
			<div className="relative h-12 w-12">
				{/* Spinner */}
				<div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
				{/* Inner dot */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-2 w-2 rounded-full bg-primary"></div>
				</div>
			</div>
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	)
})
