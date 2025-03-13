// page.tsx
import { CafeCard } from "@/components/custom-ui/CafeCard"
import { getMaps } from "@/lib/supabase/mapsService"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { Suspense } from "react"

// Set revalidate to 0 to ensure fresh data on each request
export const revalidate = 0

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
					<Link key={map.id} href={`/maps/${map.id}`}>
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

export default async function HomePage({ searchParams }: HomeProps) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const resolvedSearchParams = await searchParams
	const page = parseInt(resolvedSearchParams.page || "1", 10)
	const limit = 10

	return (
		<main className="min-h-screen bg-gray-50/50">
			<div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
				<div className="text-center mb-12">
					<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
						A community-driven project to aggregate
						<span className="text-primary"> cool places in Bengaluru</span>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Discover and share the best spots in Bangalore - from cafes and
						restaurants to entertainment venues.
					</p>
				</div>

				<Suspense
					fallback={
						<LoadingIndicator message="Loading maps from Bengaluru..." />
					}
				>
					<MapsList page={page} limit={limit} userId={user?.id} />
				</Suspense>
			</div>
		</main>
	)
}
