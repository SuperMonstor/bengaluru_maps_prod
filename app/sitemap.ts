import { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { getMaps } from "@/lib/supabase/mapsService"
import { slugify } from "@/lib/utils/slugify"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// Base URLs that we know exist
	const baseUrls = [
		{
			url: "https://www.bengalurumaps.com",
			lastModified: new Date(),
			changeFrequency: "daily" as const,
			priority: 1,
		},
		{
			url: "https://www.bengalurumaps.com/create-map",
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		},
		{
			url: "https://www.bengalurumaps.com/my-maps",
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.7,
		},
	]

	try {
		// Get all public maps
		const supabase = await createClient()
		const { data: maps } = await getMaps(1, 100) // Get first 100 maps

		// Add map URLs to sitemap
		const mapUrls =
			maps?.map((map) => {
				const slug = map.slug || slugify(map.title)
				return {
					url: `https://www.bengalurumaps.com/maps/${slug}`,
					lastModified: new Date(),
					changeFrequency: "weekly" as const,
					priority: 0.9,
				}
			}) || []

		return [...baseUrls, ...mapUrls] as MetadataRoute.Sitemap
	} catch (error) {
		console.error("Error generating sitemap:", error)
		return baseUrls as MetadataRoute.Sitemap
	}
}
