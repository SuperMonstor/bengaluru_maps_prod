// app/maps/[mapId]/ClientMapPageContent.tsx
"use client"

import { useState, useRef } from "react"
import { Markdown } from "@/components/markdown-renderer"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Users, ThumbsUp, ChevronUp, ChevronDown } from "lucide-react"
import ShareButton from "@/components/sharebutton"

const PLACEHOLDER_MAP_URL =
	"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1599581471747!2d-74.0060!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a27e51633e3%3A0x51c6e1819a5b51a8!2sNew%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1631834567890"

interface MapData {
	id: string
	title: string
	description: string
	body: string
	image: string
	locations: number
	contributors: number
	upvotes: number
	username: string
	userProfilePicture: string | null
}

interface ClientMapPageContentProps {
	map: MapData
}

export default function ClientMapPageContent({
	map,
}: ClientMapPageContentProps) {
	const [isOpen, setIsOpen] = useState(false)
	const iframeRef = useRef<HTMLIFrameElement>(null)

	const handleMapInteraction = () => {
		if (isOpen) {
			setIsOpen(false)
		}
	}

	const handleCollapse = () => {
		setIsOpen(false)
	}

	return (
		<main className="min-h-screen bg-gray-50/50 flex flex-col">
			{/* Desktop Layout */}
			<div className="hidden md:flex flex-1 overflow-hidden">
				{/* Left Column: Scrollable */}
				<div className="w-1/2 p-4 md:p-8 lg:p-12 space-y-6 overflow-y-auto">
					<div className="flex items-center gap-4">
						<h1 className="text-3xl font-bold tracking-tight text-foreground">
							{map.title}
						</h1>
						{/* <ShareButton mapId={map.id} /> */}
					</div>
					<div className="space-y-2">
						<p className="text-muted-foreground text-sm line-clamp-2">
							{map.description}
						</p>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Avatar className="h-8 w-8 border border-border/50">
							<AvatarImage src={map.userProfilePicture || "/placeholder.svg"} />
							<AvatarFallback>
								{map.username
									.split(" ")
									.map((n: string) => n[0])
									.join("")
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span>
							Started by <span className="font-medium">{map.username}</span>
						</span>
					</div>
					<div className="flex gap-4 text-sm text-muted-foreground">
						<span>
							<MapPin className="inline mr-1 h-4 w-4" />
							{map.locations} locations
						</span>
						<span>
							<Users className="inline mr-1 h-4 w-4" />
							{map.contributors} contributors
						</span>
						<span>
							<ThumbsUp className="inline mr-1 h-4 w-4" />
							{map.upvotes} upvotes
						</span>
					</div>
					{/* Markdown at the bottom */}
					<div className="mt-6">
						<Markdown content={map.body} />
					</div>
				</div>

				{/* Right Column: Full-height Map up to the edge */}
				<div className="w-1/2">
					<iframe
						src={PLACEHOLDER_MAP_URL}
						width="100%"
						height="100%"
						style={{ border: 0 }}
						allowFullScreen
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
					/>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="md:hidden relative min-h-screen">
				{/* Full-screen Map */}
				<div className="absolute inset-0">
					<iframe
						ref={iframeRef}
						src={PLACEHOLDER_MAP_URL}
						width="100%"
						height="100%"
						style={{ border: 0 }}
						allowFullScreen
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
						onFocus={handleMapInteraction}
						onClick={handleMapInteraction}
					/>
				</div>

				{/* Bottom Bar with Title, Subtitle, and Metadata */}
				<div
					className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 cursor-pointer z-10"
					onClick={() => setIsOpen(!isOpen)}
				>
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold truncate">{map.title}</h2>
							<ChevronUp
								className={`h-6 w-6 transition-transform ${
									isOpen ? "rotate-180" : ""
								}`}
							/>
						</div>
						<p className="text-muted-foreground text-sm truncate">
							{map.description}
						</p>
						<div className="flex flex-col gap-1 text-sm text-muted-foreground">
							<span>
								Started by <span className="font-medium">{map.username}</span>
							</span>
							<div className="flex gap-4">
								<span>
									<MapPin className="inline mr-1 h-4 w-4" />
									{map.locations} locations
								</span>
								<span>
									<Users className="inline mr-1 h-4 w-4" />
									{map.contributors} contributors
								</span>
								<span>
									<ThumbsUp className="inline mr-1 h-4 w-4" />
									{map.upvotes} upvotes
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Sliding Panel */}
				<div
					className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-transform duration-300 ease-in-out transform ${
						isOpen ? "translate-y-0" : "translate-y-full"
					} max-h-[80vh] overflow-y-auto z-20`}
					style={{ top: "auto" }}
				>
					<div className="p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h1 className="text-2xl font-bold tracking-tight text-foreground">
								{map.title}
							</h1>
							<button
								onClick={handleCollapse}
								className="p-2 rounded-full hover:bg-gray-100"
								aria-label="Collapse panel"
							>
								<ChevronDown className="h-6 w-6" />
							</button>
						</div>
						<div className="space-y-2">
							<p className="text-muted-foreground text-sm">{map.description}</p>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Avatar className="h-8 w-8 border border-border/50">
								<AvatarImage
									src={map.userProfilePicture || "/placeholder.svg"}
								/>
								<AvatarFallback>
									{map.username
										.split(" ")
										.map((n: string) => n[0])
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span>
								Started by <span className="font-medium">{map.username}</span>
							</span>
						</div>
						<div className="flex gap-4 text-sm text-muted-foreground">
							<span>
								<MapPin className="inline mr-1 h-4 w-4" />
								{map.locations} locations
							</span>
							<span>
								<Users className="inline mr-1 h-4 w-4" />
								{map.contributors} contributors
							</span>
							<span>
								<ThumbsUp className="inline mr-1 h-4 w-4" />
								{map.upvotes} upvotes
							</span>
						</div>
						<div className="mt-4">
							<Markdown content={map.body} />
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
