import { getMapById } from "@/lib/supabase/mapsService"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { redirect } from "next/navigation"
import { slugify } from "@/lib/utils/slugify"
import ClientMapPageContent from "./ClientMapPageComponent"

interface MapPageProps {
	params: Promise<{ slug: string; id: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function MapContent({
	id,
	searchParams,
}: {
	id: string
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	try {
		const { data: map, error } = await getMapById(id, user?.id)

		if (error || !map) {
			return (
				<div className="container mx-auto px-4 py-8">
					<p className="text-red-500">
						Error loading map: {error || "Map not found"}
					</p>
				</div>
			)
		}

		return (
			<ClientMapPageContent map={map} user={user} searchParams={searchParams} />
		)
	} catch (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-red-500">
					Error loading map:{" "}
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			</div>
		)
	}
}

export default async function MapPage({ params, searchParams }: MapPageProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const resolvedParams = await params
	const { slug, id } = resolvedParams

	const resolvedSearchParams = await searchParams

	// Get the map to verify the slug
	const { data: map, error } = await getMapById(id, user?.id)

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

	// Verify that the slug in the URL matches the map's slug
	// If not, redirect to the correct URL
	const correctSlug = map.slug || slugify(map.title)
	if (slug !== correctSlug) {
		// Check if expand parameter exists
		const expand = resolvedSearchParams?.expand ? "?expand=true" : ""
		redirect(`/maps/${correctSlug}/${id}${expand}`)
	}

	return (
		<main className="min-h-screen bg-gray-50/50">
			<Suspense fallback={<LoadingIndicator />}>
				<MapContent id={id} searchParams={resolvedSearchParams} />
			</Suspense>
		</main>
	)
}
