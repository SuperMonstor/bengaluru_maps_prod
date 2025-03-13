/**
 * Converts a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
	if (!text) return "map"

	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/&/g, "-and-") // Replace & with 'and'
		.replace(/[^\w\-]+/g, "") // Remove all non-word characters
		.replace(/\-\-+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start of text
		.replace(/-+$/, "") // Trim - from end of text
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
