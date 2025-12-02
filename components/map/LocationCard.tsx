"use client"

import { Location } from "@/lib/types/mapTypes"
import { cn } from "@/lib/utils/utils"
import { LocationUpvoteButton } from "./LocationUpvoteButton"
import { MapPin, User } from "lucide-react"
import { formatDistance } from "@/lib/utils/distance"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

import { memo } from "react"

interface LocationCardProps {
    location: Location
    onClick: (location: Location) => void
    isSelected?: boolean
    distance?: number | null
    onMouseEnter?: (id: string) => void
    onMouseLeave?: () => void
}

export const LocationCard = memo(function LocationCard({
    location,
    onClick,
    isSelected = false,
    distance,
    onMouseEnter,
    onMouseLeave,
}: LocationCardProps) {
    return (
        <div
            onClick={() => onClick(location)}
            onMouseEnter={() => onMouseEnter?.(location.id)}
            onMouseLeave={onMouseLeave}
            className={cn(
                "group relative flex flex-col gap-2 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                isSelected
                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                    : "bg-white border-gray-100 hover:border-gray-200"
            )}
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "font-semibold text-gray-900 leading-tight mb-1 line-clamp-2",
                        isSelected && "text-blue-700"
                    )}>
                        {location.name}
                    </h3>

                    {distance !== undefined && distance !== null && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formatDistance(distance)} away
                        </p>
                    )}
                </div>

                <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex flex-col items-end gap-2">
                    <LocationUpvoteButton
                        locationId={location.id}
                        initialUpvotes={location.upvotes ?? 0}
                        initialIsUpvoted={location.hasUpvoted}
                        variant="compact"
                        className="bg-gray-50 hover:bg-gray-100"
                    />
                </div>
            </div>

            {location.note && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">
                    {location.note}
                </p>
            )}

            {/* Submitter Info */}
            <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Avatar className="h-4 w-4 border border-gray-200">
                        {location.user_avatar ? (
                            <Image
                                src={location.user_avatar}
                                alt={location.user_username || "User"}
                                fill
                                className="object-cover rounded-full"
                                sizes="16px"
                            />
                        ) : (
                            <AvatarFallback className="text-[8px]">
                                {location.user_username?.slice(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <span className="font-medium truncate max-w-[150px]">
                        Added by {location.user_username || "Unknown User"}
                    </span>
                </div>
            </div>
        </div>
    )
})
