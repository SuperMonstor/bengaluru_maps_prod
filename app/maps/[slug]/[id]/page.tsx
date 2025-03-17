import { getMapById } from "@/lib/supabase/mapsService"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { redirect } from "next/navigation"
import { slugify } from "@/lib/utils/slugify"
import ClientMapPageContent from "./ClientMapPageComponent"
import type { Metadata, ResolvingMetadata } from "next"

// Add revalidate for ISR
export const revalidate = 60

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

// Separate component for the map shell that loads immediately
function MapShell() {
	return (
		<div className="bg-gray-50/50 w-full h-full">
			<div className="container mx-auto px-4 py-8">
				<div className="animate-pulse">
					<div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
					<div className="h-4 w-1/2 bg-gray-200 rounded mb-8"></div>
					<div className="h-64 bg-gray-200 rounded mb-6"></div>
					<div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
					<div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
					<div className="h-4 w-3/4 bg-gray-200 rounded mb-6"></div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="h-32 bg-gray-200 rounded"></div>
						<div className="h-32 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		</div>
	)
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
				<div className="bg-gray-50/50 w-full">
					<div className="container mx-auto px-4 py-8">
						<p className="text-red-500">
							Error loading map: {error || "Map not found"}
						</p>
					</div>
				</div>
			)
		}

		return (
			<div className="bg-gray-50/50 w-full">
				<ClientMapPageContent
					map={map}
					user={user}
					searchParams={searchParams}
				/>
			</div>
		)
	} catch (error) {
		return (
			<div className="bg-gray-50/50 w-full">
				<div className="container mx-auto px-4 py-8">
					<p className="text-red-500">
						Error loading map:{" "}
						{error instanceof Error ? error.message : "Unknown error"}
					</p>
				</div>
			</div>
		)
	}
}

// Component to handle slug validation without returning React elements
function SlugValidator({
	slug,
	id,
	searchParams,
}: {
	slug: string
	id: string
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	// This is a server component that will run on the server
	// and redirect if needed, but won't render anything
	const validateSlug = async () => {
		const supabase = await createClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()
		const { data: map, error } = await getMapById(id, user?.id)

		if (!error && map) {
			const correctSlug = map.slug || slugify(map.title)
			if (slug !== correctSlug) {
				const expand = searchParams?.expand ? "?expand=true" : ""
				redirect(`/maps/${correctSlug}/${id}${expand}`)
			}
		}
	}

	// Execute the validation but don't return anything to render
	validateSlug()

	// Return null to avoid rendering anything
	return null
}

export default async function MapPage({ params, searchParams }: MapPageProps) {
	const resolvedParams = await params
	const { slug, id } = resolvedParams
	const resolvedSearchParams = await searchParams

	// Create a lightweight JSON-LD with minimal data that can be rendered immediately
	const basicJsonLd = {
		"@context": "https://schema.org",
		"@type": "Map",
		name: "Bengaluru Map",
		description: "A community-driven map of locations in Bengaluru.",
		url: `https://www.bengalurumaps.com/maps/${slug}/${id}`,
	}

	return (
		<>
			{/* Add basic JSON-LD structured data immediately */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(basicJsonLd) }}
			/>

			{/* Add client-side script to improve loading experience */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
						(function() {
							try {
								// Check if we came from a specific map card
								const lastClickedMapCard = sessionStorage.getItem('lastClickedMapCard');
								const currentPath = window.location.pathname;
								
								if (lastClickedMapCard && currentPath === lastClickedMapCard) {
									// We came from the card that matches this page
									// Clear the storage item
									sessionStorage.removeItem('lastClickedMapCard');
									
									// Add a class to the body to indicate we're coming from a card
									document.body.classList.add('from-map-card');
								}
							} catch (e) {
								console.error('Error in map page script:', e);
							}
						})();
					`,
				}}
			/>

			{/* Show a skeleton UI immediately */}
			<Suspense fallback={<MapShell />}>
				{/* Check slug validity without rendering the result */}
				<SlugValidator
					slug={slug}
					id={id}
					searchParams={resolvedSearchParams}
				/>

				{/* Load the actual content */}
				<MapContent id={id} searchParams={resolvedSearchParams} />
			</Suspense>
		</>
	)
}
