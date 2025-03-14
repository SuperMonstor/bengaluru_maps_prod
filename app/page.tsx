// page.tsx
import { CafeCard } from "@/components/custom-ui/CafeCard"
import { getMaps } from "@/lib/supabase/mapsService"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"
import type { Metadata } from "next"

// Set revalidate to 0 to ensure fresh data on each request
export const revalidate = 0

// Add specific metadata for the home page
export const metadata: Metadata = {
	title: "Bengaluru Maps | Discover the Best Places in Bengaluru",
	description:
		"Explore community-driven maps of Bengaluru's best cafes, restaurants, and hangout spots. Create your own maps and share your favorite places with the community.",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Bengaluru Maps | Discover the Best Places in Bengaluru",
		description:
			"Explore community-driven maps of Bengaluru's best cafes, restaurants, and hangout spots.",
		url: "https://www.bengalurumaps.com/",
		siteName: "Bengaluru Maps",
		locale: "en_IN",
		type: "website",
	},
}

interface HomeProps {
	searchParams: Promise<{ page?: string }>
}

// Separate component for data fetching that can be wrapped with Suspense
async function MapsList({
	page,
	limit,
	userId,
}: {
	page: number
	limit: number
	userId?: string
}) {
	const { data: maps, total, error } = await getMaps(page, limit, userId)
	const totalPages = Math.ceil(total / limit)

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-red-500">Error loading maps: {error}</p>
			</div>
		)
	}

	return (
		<>
			<div className="grid gap-6 max-w-5xl mx-auto">
				{maps.map((map) => (
					<Link key={map.id} href={`/maps/${map.slug || "map"}/${map.id}`}>
						<CafeCard
							mapId={map.id}
							title={map.title}
							description={map.description}
							image={map.image}
							locations={map.locations}
							contributors={map.contributors}
							upvotes={map.upvotes}
							initialIsUpvoted={map.hasUpvoted}
							username={map.username}
							userProfilePicture={map.userProfilePicture}
						/>
					</Link>
				))}
			</div>

			{totalPages > 1 && (
				<div className="flex justify-center gap-4 mt-8">
					<Button variant="outline" disabled={page === 1} asChild={page !== 1}>
						<a href={`/?page=${page - 1}`}>Previous</a>
					</Button>
					<span className="self-center">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="outline"
						disabled={page === totalPages}
						asChild={page !== totalPages}
					>
						<a href={`/?page=${page + 1}`}>Next</a>
					</Button>
				</div>
			)}
		</>
	)
}

export default async function Home({ searchParams }: HomeProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const resolvedSearchParams = await searchParams
	const currentPage = resolvedSearchParams?.page
		? parseInt(resolvedSearchParams.page)
		: 1
	const limit = 10

	// JSON-LD structured data for better SEO
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "Bengaluru Maps",
		url: "https://www.bengalurumaps.com/",
		potentialAction: {
			"@type": "SearchAction",
			target: "https://www.bengalurumaps.com/?search={search_term_string}",
			"query-input": "required name=search_term_string",
		},
		description:
			"Discover the best cafes, restaurants, and hangout spots in Bengaluru through community-driven maps.",
		publisher: {
			"@type": "Organization",
			name: "Bengaluru Maps",
			logo: {
				"@type": "ImageObject",
				url: "https://www.bengalurumaps.com/logo.png",
			},
		},
	}

	return (
		<main className="min-h-screen bg-gray-50/50">
			{/* Add JSON-LD structured data */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col items-center justify-center mb-12">
					<h1 className="text-4xl font-bold text-center mb-4">
						Discover Bengaluru&apos;s Best Places
					</h1>
					<p className="text-xl text-center text-gray-600 max-w-2xl mb-8">
						Explore community-driven maps of Bengaluru&apos;s best cafes,
						restaurants, and hangout spots.
					</p>
					<Link href="/create-map">
						<Button size="lg">Create Your Own Map</Button>
					</Link>
				</div>

				<Suspense fallback={<LoadingIndicator />}>
					<MapsList page={currentPage} limit={limit} userId={user?.id} />
				</Suspense>
			</div>
		</main>
	)
}
