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

	// Await params before using its properties
	const resolvedParams = await params
	const { data: map } = await getMapById(resolvedParams.id, user?.id)

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

// Add CSS for map page layout
const mapPageStyles = `
	html, body {
		overflow: hidden;
		margin: 0;
		padding: 0;
		height: 100%;
	}
	
	body {
		position: fixed;
		width: 100%;
		height: 100%;
	}
	
	/* Reset any potential margins */
	* {
		box-sizing: border-box;
	}
	
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: white;
		z-index: 50;
		height: 64px;
		border-bottom: 1px solid rgba(229, 231, 235, 0.5);
	}
	
	.map-layout {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}
	
	.map-container {
		position: absolute;
		top: 64px; /* Exact header height */
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
	}
	
	.bottom-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		background: white;
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
		box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
		border-top: 1px solid rgba(229, 231, 235, 1);
	}
	
	.expanded-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 30;
		background: white;
		border-top-left-radius: 1rem;
		border-top-right-radius: 1rem;
		box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
		border-top: 1px solid rgba(229, 231, 235, 1);
	}
	
	/* Ensure 16:9 aspect ratio for map thumbnails */
	.map-thumbnail {
		aspect-ratio: 16/9;
		width: 96px;
		height: 54px;
		border-radius: 0.375rem;
		overflow: hidden;
		border: 1px solid rgba(229, 231, 235, 1);
		flex-shrink: 0;
	}
	
	/* Improved spacing for expanded panel */
	.expanded-panel .sticky {
		padding: 16px;
		border-bottom: 1px solid rgba(229, 231, 235, 1);
	}
	
	.expanded-panel h1 {
		font-size: 1.25rem;
		line-height: 1.5;
		font-weight: 700;
		margin-bottom: 4px;
	}
	
	.expanded-panel .creator-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}
	
	@media (min-width: 768px) {
		body {
			overflow: auto;
			position: static;
		}
	}
`

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
			<style dangerouslySetInnerHTML={{ __html: mapPageStyles }} />
			<Suspense fallback={<LoadingIndicator />}>
				<MapContent id={id} searchParams={resolvedSearchParams} />
			</Suspense>
		</main>
	)
}
