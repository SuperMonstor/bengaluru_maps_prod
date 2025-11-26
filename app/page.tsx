// page.tsx
import { CafeCard } from "@/components/custom-ui/CafeCard"
import { getMaps } from "@/lib/supabase/mapsService"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"
import type { Metadata } from "next"

// Set revalidate to 60 seconds for ISR instead of 0
// This allows the page to be cached and revalidated every minute
export const revalidate = 60

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
			<div className="grid gap-2xl max-w-card-max mx-auto">
				{maps.map((map, index) => (
					<Link
						key={map.id}
						href={`/maps/${map.slug || "map"}`}
						// Prefetch only the first 3 maps for better performance
						prefetch={index < 3}
						// Add a data attribute to help with transition
						data-map-card="true"
						className="transition-opacity duration-300"
					>
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
							priority={index === 0}
						/>
					</Link>
				))}
			</div>

			{totalPages > 1 && (
				<div className="flex justify-center gap-lg mt-2xl">
					<Button variant="secondary" disabled={page === 1} asChild={page !== 1}>
						<a href={`/?page=${page - 1}`}>Previous</a>
					</Button>
					<span className="self-center text-body-sm text-gray-500">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="secondary"
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
		<main className="min-h-screen bg-[#FAFAF9]">
			{/* Add JSON-LD structured data */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			{/* Add client-side script to handle transitions */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
						(function() {
							try {
								document.addEventListener('click', function(e) {
									// Find the closest map card link
									const mapCard = e.target.closest('[data-map-card="true"]');
									if (mapCard) {
										// Store the clicked card URL to help with navigation
										const href = mapCard.getAttribute('href');
										if (href) {
											sessionStorage.setItem('lastClickedMapCard', href);
										}
										
										// Add a small delay to allow for visual feedback
										setTimeout(() => {
											// Fade out all cards except the clicked one
											document.querySelectorAll('[data-map-card="true"]').forEach(card => {
												if (card !== mapCard) {
													card.style.opacity = '0.5';
													card.style.transform = 'scale(0.98)';
													card.style.transition = 'opacity 300ms ease, transform 300ms ease';
												} else {
													// Highlight the clicked card
													card.style.transform = 'scale(1.02)';
													card.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
													card.style.transition = 'transform 300ms ease, box-shadow 300ms ease';
												}
											});
										}, 50);
									}
								});
							} catch (e) {
								// Silently fail if there's an error
								console.error('Error in transition script:', e);
							}
						})();
					`,
				}}
			/>

			<div className="container mx-auto px-lg md:px-2xl py-2xl max-w-6xl">
				<div className="flex flex-col items-center justify-center mb-3xl">
					<h1 className="text-[44px] font-bold text-center mb-md tracking-tight text-gray-900 leading-tight">
						Discover Bengaluru&apos;s Best Places
					</h1>
					<p className="text-[19px] text-center text-gray-500 max-w-2xl mb-2xl leading-relaxed">
						Explore community-driven maps of Bengaluru&apos;s best cafes,
						restaurants, and hangout spots.
					</p>
					<Link href="/create-map" prefetch={false}>
						<Button variant="primary" size="lg" className="px-2xl py-xl text-body">
							Create Your Own Map
						</Button>
					</Link>
				</div>

				<div className="flex items-center justify-center mb-2xl">
					<div className="flex items-center bg-gray-100 border border-gray-300 rounded-pill px-lg py-sm text-body-sm text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							className="w-4 h-4 mr-sm text-gray-500"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M5 15l7-7 7 7"
							/>
						</svg>
						<span className="font-medium">Maps sorted by most upvoted</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							className="w-4 h-4 ml-sm text-gray-500"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>

				<Suspense fallback={<LoadingIndicator />}>
					<MapsList page={currentPage} limit={limit} userId={user?.id} />
				</Suspense>
			</div>
		</main>
	)
}
