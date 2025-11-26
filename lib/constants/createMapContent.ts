/**
 * Constants for the Create Map page
 * Contains all text content, placeholders, and suggestions
 */

export const CREATE_MAP_CONTENT = {
	title: "Create Your Map",
	subtitle: "Share your favorite places in Bengaluru with the community.",

	form: {
		title: {
			label: "Title",
			placeholder: "e.g., Best Biriyani Spots in Bengaluru",
		},
		slug: {
			label: "URL Slug",
			description: "This will be the URL for your map: bengalurumaps.com/maps/",
			placeholder: "best-biriyani-spots-in-bengaluru",
		},
		shortDescription: {
			label: "Short Description",
			description:
				"A one-liner about the map that will appear in search results and previews.",
			placeholder: "Brief description of your map (max 60 characters)",
			maxLength: 60,
		},
		displayPicture: {
			label: "Display Picture (16:9 recommended)",
		},
		body: {
			label: "Body (Describe what this map is about in detail)",
			placeholder: "Describe your map here using Markdown",
		},
	},

	mapIdeas: {
		title: "Map Ideas",
		description: "Not sure what to create? Here are some popular map ideas:",
		ideas: [
			"Pet-Friendly Spots – Cafes, parks, and restaurants that welcome pets",
			"Startup & Co-Working Spaces – Work-friendly cafes and coworking spaces with strong Wi-Fi",
			"First Date Spots – Places perfect for a first date, categorized by vibe",
			"Book Lovers' Map – The best bookstores, reading cafés, and quiet nooks",
			"Gaming & Esports Hubs – Gaming cafes, VR arcades, and esports lounges",
		],
	},

	chatGPTPrompt: {
		title: "Need help? Copy this prompt for ChatGPT:",
		template: `Write a description for my Bengaluru map about [YOUR MAP TOPIC] in markdown. Include:
1. Brief introduction explaining the purpose of this map
2. What makes a good location for this collection
3. Submission guidelines (photos, details required)
4. Criteria for approving submissions`,
		helpText: "Format with: # for headers, * for lists, **bold** for emphasis",
	},

	ownership: {
		title: "Map Ownership",
		description:
			"You get some pretty sweet priviliges as a map creator:",
		privileges: [
			"Locations will only be added on your approval",
			"You get to determine the quality and relevance of locations on your map",
			"You set guidelines for what should be included",
		],
		agreement:
			"By submitting this form, you agree to take on these responsibilities.",
	},

	buttons: {
		submit: "Submit",
		submitting: "Creating Map...",
	},
} as const
