import { getMapById } from "@/lib/supabase/mapsService"
import ClientMapPageContent from "./ClientMapPageComponent"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"

interface MapPageProps {
	params: Promise<{ mapId: string }>
}

// Separate component for data fetching that can be wrapped with Suspense
async function MapContent({
	mapId,
	userId,
}: {
	mapId: string
	userId?: string
}) {
	const { data: map, error } = await getMapById(mapId, userId)

	if (error || !map) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-red-500">
					Error loading map: {error || "Map not found"}
				</p>
			</div>
		)
	}

	// Pass the map directly since it now includes hasUpvoted
	return <ClientMapPageContent map={map} />
}

export default async function MapPage({ params }: MapPageProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const resolvedParams = await params
	const mapId = resolvedParams.mapId

	return (
		<main className="min-h-screen bg-gray-50/50">
			<Suspense
				fallback={<LoadingIndicator message="Loading map details..." />}
			>
				<MapContent mapId={mapId} userId={user?.id} />
			</Suspense>
		</main>
	)
}
