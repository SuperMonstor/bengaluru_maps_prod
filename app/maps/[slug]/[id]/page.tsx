import { getMapById } from "@/lib/supabase/mapsService"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { redirect } from "next/navigation"
import { slugify } from "@/lib/utils/slugify"
import ClientMapPageContent from "./ClientMapPageComponent"
import type { Metadata, ResolvingMetadata } from "next"

interface MapPageProps {
	params: Promise<{ slug: string; id: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate dynamic metadata for each map page
export async function generateMetadata(
	{ params }: { params: { slug: string; id: string } },
	parent: ResolvingMetadata
): Promise<Metadata> {
	// Get the map data
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const { data: map } = await getMapById(params.id, user?.id)

	// If no map is found, return default metadata
	if (!map) {
		return {
			title: "Map Not Found | Bengaluru Maps",
			description: "The requested map could not be found.",
		}
	}

	// Get the parent metadata
	const previousImages = (await parent).openGraph?.images || []

	// Create metadata with map-specific information
	return {
		title: `${map.title} | Bengaluru Maps`,
		description:
			map.description ||
			`Explore ${map.title} - a community-driven map on Bengaluru Maps with ${
				map.locations?.length || 0
			} locations.`,
		openGraph: {
			title: `${map.title} | Bengaluru Maps`,
			description:
				map.description ||
				`Explore ${map.title} - a community-driven map with ${
					map.locations?.length || 0
				} locations in Bengaluru.`,
			images: map.image ? [map.image, ...previousImages] : previousImages,
		},
		twitter: {
			card: "summary_large_image",
			title: `${map.title} | Bengaluru Maps`,
			description:
				map.description ||
				`Explore ${map.title} - a community-driven map with ${
					map.locations?.length || 0
				} locations in Bengaluru.`,
			images: map.image ? [map.image] : [],
		},
	}
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

	// Create JSON-LD structured data for this map
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Map",
		name: map.title,
		description:
			map.description || `A community-driven map of locations in Bengaluru.`,
		url: `https://www.bengalurumaps.com/maps/${correctSlug}/${id}`,
		author: {
			"@type": "Person",
			name: map.username || "Bengaluru Maps User",
		},
		dateCreated: new Date().toISOString(),
		locationCreated: {
			"@type": "Place",
			name: "Bengaluru, India",
		},
		contentLocation: {
			"@type": "Place",
			name: "Bengaluru, India",
			geo: {
				"@type": "GeoCoordinates",
				latitude: "12.9716",
				longitude: "77.5946",
			},
		},
		about: {
			"@type": "Thing",
			name: "Bengaluru Points of Interest",
			description: "Interesting locations in Bengaluru, India",
		},
		thumbnailUrl:
			map.image || "https://www.bengalurumaps.com/images/og-image.jpg",
	}

	return (
		<main className="min-h-screen bg-gray-50/50">
			{/* Add JSON-LD structured data */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<Suspense fallback={<LoadingIndicator />}>
				<MapContent id={id} searchParams={resolvedSearchParams} />
			</Suspense>
		</main>
	)
}
