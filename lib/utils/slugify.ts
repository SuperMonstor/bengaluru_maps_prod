import slugifyLib from "slugify"

/**
 * Converts a string to a URL-friendly slug with proper unicode transliteration
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
	if (!text) return "map"

	return slugifyLib(text, {
		lower: true,
		strict: true,
		locale: "en",
		trim: true,
	})
}

/**
 * Generates a unique slug by checking the database directly
 * @param title The title to generate a slug from
 * @param supabaseClient Supabase client to query the database
 * @returns A unique slug
 */
export async function generateUniqueSlug(
	title: string,
	supabaseClient: any
): Promise<string> {
	const baseSlug = slugify(title)

	// Check if base slug exists
	const { data: existingMap } = await supabaseClient
		.from("maps")
		.select("slug")
		.eq("slug", baseSlug)
		.maybeSingle()

	if (!existingMap) {
		return baseSlug
	}

	// If slug exists, try numbered variants
	let counter = 1
	while (counter < 100) { // Safety limit
		const numberedSlug = `${baseSlug}-${counter}`
		const { data: existingNumbered } = await supabaseClient
			.from("maps")
			.select("slug")
			.eq("slug", numberedSlug)
			.maybeSingle()

		if (!existingNumbered) {
			return numberedSlug
		}
		counter++
	}

	// Fallback: append timestamp if we somehow hit 100 variations
	return `${baseSlug}-${Date.now()}`
}

/**
 * List of reserved slugs that cannot be used for maps
 */
const RESERVED_SLUGS = [
	"create-map",
	"api",
	"new",
	"edit",
	"submit",
	"pending",
	"admin",
	"settings",
]

/**
 * Validates a slug format
 * @param slug The slug to validate
 * @returns Object with validation result and optional error message
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
	if (!slug || slug.length === 0) {
		return { valid: false, error: "Slug cannot be empty" }
	}

	if (slug.length > 100) {
		return { valid: false, error: "Slug must be less than 100 characters" }
	}

	if (!/^[a-z0-9-]+$/.test(slug)) {
		return {
			valid: false,
			error:
				"Slug can only contain lowercase letters, numbers, and hyphens",
		}
	}

	if (slug.startsWith("-") || slug.endsWith("-")) {
		return { valid: false, error: "Slug cannot start or end with a hyphen" }
	}

	return { valid: true }
}

/**
 * Checks if a slug is reserved
 * @param slug The slug to check
 * @returns True if the slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
	return RESERVED_SLUGS.includes(slug.toLowerCase())
}
