"use client"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { CREATE_MAP_CONTENT } from "@/lib/constants/createMapContent"
import { Lightbulb } from "lucide-react"

interface MapIdeasModalProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

export default function MapIdeasModal({
	isOpen,
	onOpenChange,
}: MapIdeasModalProps) {
	const ideas = CREATE_MAP_CONTENT.mapIdeas.ideas

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-lg md:text-xl flex items-center gap-2">
						<Lightbulb className="h-5 w-5 text-blue-600" />
						{CREATE_MAP_CONTENT.mapIdeas.title}
					</DialogTitle>
					<DialogDescription className="text-xs md:text-sm">
						{CREATE_MAP_CONTENT.mapIdeas.description}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-4">
					{ideas.map((idea, index) => (
						<div
							key={index}
							className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
						>
							<p className="text-sm md:text-base text-gray-800 font-medium">
								{idea}
							</p>
						</div>
					))}
				</div>

				<p className="text-xs text-gray-500 py-2 border-t">
					Click on any idea to get inspired, or feel free to create your own unique
					map!
				</p>
			</DialogContent>
		</Dialog>
	)
}
