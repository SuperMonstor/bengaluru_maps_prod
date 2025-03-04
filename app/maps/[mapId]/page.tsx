import { getMapById } from "@/lib/supabase/mapsService"
import ClientMapPageContent from "./ClientMapPageComponent"
import { getUserUpvoteStatus } from "@/lib/actions/voteActions"

interface MapPageProps {
	params: Promise<{ mapId: string }>
}

export default async function MapPage({ params }: MapPageProps) {
	const resolvedParams = await params
	const mapId = resolvedParams.mapId
	const { data: map, error } = await getMapById(mapId)

	// Get the user's upvote status for this map
	const upvoteStatus = await getUserUpvoteStatus([mapId])
	const isUpvoted = upvoteStatus[mapId] || false

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

	// Pass the full locations array directly along with the upvote status
	return <ClientMapPageContent map={map} initialIsUpvoted={isUpvoted} />
}
