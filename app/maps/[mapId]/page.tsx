import { getMapById } from "@/lib/supabase/mapsService"
import ClientMapPageContent from "./ClientMapPageComponent"
import { createClient } from "@/lib/supabase/api/supabaseServer"

interface MapPageProps {
	params: Promise<{ mapId: string }>
}

export default async function MapPage({ params }: MapPageProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const resolvedParams = await params
	const mapId = resolvedParams.mapId
	const { data: map, error } = await getMapById(mapId, user?.id)

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

	// Pass the map directly since it now includes hasUpvoted
	return <ClientMapPageContent map={map} />
}
