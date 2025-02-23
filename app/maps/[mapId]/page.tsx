// app/maps/[mapId]/page.tsx
import { getMapById } from "@/lib/supabase/maps"
import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Users, ThumbsUp } from "lucide-react"
import ShareButton from "@/components/sharebutton"

// Placeholder map embed URL (centered on NYC, as in your screenshot)
const PLACEHOLDER_MAP_URL =
	"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1599581471747!2d-74.0060!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a27e51633e3%3A0x51c6e1819a5b51a8!2sNew%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1631834567890"

interface MapPageProps {
	params: Promise<{ mapId: string }> // Explicitly type as Promise
}

export default async function MapPage({ params }: MapPageProps) {
	const resolvedParams = await params // Await the Promise
	const mapId = resolvedParams.mapId
	const { data: map, error } = await getMapById(mapId)

	if (error || !map) {
		return (
			<main className="min-h-screen bg-gray-50/50">
				<div className="container mx-auto px-4 py-8">
					<p className="text-red-500">
						Error loading map: {error || "Map not found"}
					</p>
				</div>
			</main>
		)
	}

	// Server component renders static content; client component handles interactivity
	return (
		<main className="min-h-screen bg-gray-50/50">
			<div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
				<div className="flex flex-col md:flex-row gap-8">
					{/* Left Column: Map Details */}
					<div className="w-full md:w-1/2 space-y-6">
						<div className="flex items-center gap-4">
							<h1 className="text-3xl font-bold tracking-tight text-foreground">
								{map.title}
							</h1>
							{/* <ShareButton mapId={} /> */}
						</div>
						<div className="space-y-2">
							<p className="text-muted-foreground text-sm line-clamp-2">
								{map.description}
							</p>
							<Markdown content={map.body} />
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Avatar className="h-8 w-8 border border-border/50">
								<AvatarImage
									src={map.userProfilePicture || "/placeholder.svg"}
								/>
								<AvatarFallback>
									{map.username
										.split(" ")
										.map((n) => n[0])
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
					</div>

					{/* Right Column: Placeholder Map */}
					<div className="w-full md:w-1/2 h-[400px] rounded-lg overflow-hidden">
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
			</div>
		</main>
	)
}
