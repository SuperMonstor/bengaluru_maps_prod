// app/maps/[mapId]/page.tsx
import { getMapById } from "@/lib/supabase/maps"
import ClientMapPageContent from "./ClientMapPageComponent"

const PLACEHOLDER_MAP_URL =
	"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1599581471747!2d-74.0060!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a27e51633e3%3A0x51c6e1819a5b51a8!2sNew%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1631834567890"

interface MapPageProps {
	params: Promise<{ mapId: string }>
}

export default async function MapPage({ params }: MapPageProps) {
	const resolvedParams = await params
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

	return <ClientMapPageContent map={map} />
}
