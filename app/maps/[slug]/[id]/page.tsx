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

// Fix the generateMetadata parameter to match MapPageProps
export async function generateMetadata(
	{ params }: MapPageProps, // Changed to use MapPageProps
	parent: ResolvingMetadata
): Promise<Metadata> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	// Await params since it's a Promise
	const resolvedParams = await params
	const { data: map } = await getMapById(resolvedParams.id, user?.id)

	if (!map) {
		return {
			title: "Map Not Found | Bengaluru Maps",
			description: "The requested map could not be found.",
		}
	}

	const previousImages = (await parent).openGraph?.images || []

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

	const correctSlug = map.slug || slugify(map.title)
	if (slug !== correctSlug) {
		const expand = resolvedSearchParams?.expand ? "?expand=true" : ""
		redirect(`/maps/${correctSlug}/${id}${expand}`)
	}

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
