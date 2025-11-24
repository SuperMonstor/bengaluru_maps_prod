import slugifyLib from "slugify"

/**
 * Converts a string to a URL-friendly slug with proper unicode transliteration
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
	if (!text) return "map"

	return slugifyLib(text, {
		lower: true, // Convert to lowercase
		strict: true, // Strip special characters
		remove: /[*+~.()'"!:@]/g, // Remove specific characters
		replacement: "-", // Replace spaces with hyphens
	})
}

/**
 * Generates a unique slug based on a title and a list of existing slugs
 * @param title The title to generate a slug from
 * @param existingSlugs An array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(
	title: string,
	existingSlugs: string[] = []
): string {
	let slug = slugify(title)

	if (!existingSlugs.includes(slug)) {
		return slug
	}

	// If the slug already exists, append a number
	let counter = 1
	let uniqueSlug = `${slug}-${counter}`

	while (existingSlugs.includes(uniqueSlug)) {
		counter++
		uniqueSlug = `${slug}-${counter}`
	}

	return uniqueSlug
}
