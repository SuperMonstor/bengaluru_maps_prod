"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils/utils"
import { Contributor } from "@/lib/types/mapTypes"

export type { Contributor }

interface CollaboratorAvatarsProps {
	contributors: Contributor[]
	maxDisplayed?: number
	size?: "sm" | "md" | "lg"
}

export function CollaboratorAvatars({
	contributors = [],
	maxDisplayed = 4,
	size = "md",
}: CollaboratorAvatarsProps) {
	if (!contributors || contributors.length === 0) {
		return null
	}

	const sizeClasses = {
		sm: "h-6 w-6",
		md: "h-8 w-8",
		lg: "h-10 w-10",
	}

	const remainingCount = contributors.length - maxDisplayed

	// Sort contributors to show owner first, then others
	const sortedContributors = [...contributors].sort((a, b) =>
		a.is_owner === b.is_owner ? 0 : a.is_owner ? -1 : 1
	)

	return (
		<TooltipProvider delayDuration={100}>
			<div className="flex items-center">
				<div className="flex -space-x-3 rtl:space-x-reverse">
					{sortedContributors.slice(0, maxDisplayed).map((contributor, index) => (
						<Tooltip key={contributor.id}>
							<TooltipTrigger asChild>
								<Avatar
									className={cn(
										"border-2 border-background",
										sizeClasses[size]
									)}
								>
									<AvatarImage
										src={contributor.picture_url ?? undefined}
										alt={contributor.full_name}
									/>
									<AvatarFallback>
										{contributor.full_name
											?.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									{contributor.full_name}
									{contributor.is_owner && " (Owner)"}
								</p>
							</TooltipContent>
						</Tooltip>
					))}

					{remainingCount > 0 && (
						<Tooltip>
							<TooltipTrigger asChild>
								<div
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground",
										sizeClasses[size]
									)}
								>
									+{remainingCount}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{remainingCount} more collaborators</p>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</div>
		</TooltipProvider>
	)
}
