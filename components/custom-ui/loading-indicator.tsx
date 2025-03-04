export function LoadingIndicator() {
	return (
		<div className="min-h-[200px] rounded-md shadow-sm bg-white flex items-center justify-center">
			<div className="relative h-10 w-10">
				{/* Outer ring */}
				<div className="absolute inset-0 rounded-full border-2 border-muted opacity-25"></div>
				{/* Spinner */}
				<div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
				{/* Inner dot */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-2 w-2 rounded-full bg-primary"></div>
				</div>
			</div>
		</div>
	)
}
