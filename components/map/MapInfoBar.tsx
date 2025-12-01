"use client"

import { useState } from "react"
import { MapUI } from "@/lib/types/mapTypes"
import { Info, ChevronUp } from "lucide-react"
import { MapDetailsDialog } from "./MapDetailsDialog"

interface MapInfoBarProps {
    map: MapUI
    className?: string
}

export function MapInfoBar({ map, className }: MapInfoBarProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Calculate stats
    const approvedLocationsCount = map.locations.filter(l => l.is_approved).length

    return (
        <>
            <div className={className}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-lg rounded-full pl-4 pr-2 py-2 hover:bg-white transition-all group"
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                            <Info className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold text-gray-900 leading-none">
                                {map.title}
                            </span>
                            <span className="text-xs text-gray-500 leading-none mt-1">
                                {approvedLocationsCount} locations
                            </span>
                        </div>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors ml-2">
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                    </div>
                </button>
            </div>

            <MapDetailsDialog
                map={map}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    )
}
