"use client"

import { Location } from "@/lib/types/mapTypes"
import { cn } from "@/lib/utils/utils"
import { LocationUpvoteButton } from "./LocationUpvoteButton"
import { MapPin } from "lucide-react"
import { formatDistance } from "@/lib/utils/distance"

interface LocationCardProps {
    location: Location
    onClick: (location: Location) => void
    isSelected?: boolean
    distance?: number | null
}

export function LocationCard({
    location,
    onClick,
    isSelected = false,
    distance,
}: LocationCardProps) {
    return (
        <div
            onClick={() => onClick(location)}
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
                        "font-semibold text-gray-900 truncate leading-tight mb-1",
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

                <div onClick={(e) => e.stopPropagation()}>
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
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {location.note}
                </p>
            )}
        </div>
    )
}
