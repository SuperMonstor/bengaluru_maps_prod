"use client"

import { MapUI } from "@/lib/types/mapTypes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Markdown } from "@/components/markdown/MarkdownRenderer"

interface MapDetailsDialogProps {
    map: MapUI
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function MapDetailsDialog({ map, isOpen, onOpenChange }: MapDetailsDialogProps) {
    const approvedLocationsCount = map.locations.filter(l => l.is_approved).length

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{map.title}</DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* Cover Image */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <Image
                            src={map.image}
                            alt={map.title}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                                {approvedLocationsCount} locations
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                                {map.contributors} contributors
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                            {map.description}
                        </p>

                        <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50/50 p-4 rounded-xl">
                            <Markdown content={map.body} />
                        </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <Avatar className="h-10 w-10 border border-gray-200">
                            {map.userProfilePicture ? (
                                <Image
                                    src={map.userProfilePicture}
                                    alt={map.username}
                                    fill
                                    className="object-cover rounded-full"
                                    sizes="40px"
                                />
                            ) : (
                                <AvatarFallback>
                                    {map.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Created by</span>
                            <span className="font-medium text-gray-900">{map.username}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Link href={`/maps/${map.slug || "map"}/submit`} className="flex-1">
                            <Button className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                                Suggest Location
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
