import { createClient } from "./api/supabaseClient"
import { LocationSuggestion } from "@/lib/types/mapTypes"

export async function getLocationDetails(location: string): Promise<{
	latitude: number
	longitude: number
	googleMapsUrl: string
	name: string
}> {
	try {
		let latitude: number = 0
		let longitude: number = 0
		let googleMapsUrl: string = ""
		let name: string = ""

		if (location.startsWith("http")) {
			const url = new URL(location)
			const pathParts = url.pathname.split("/")
			if (pathParts.includes("place") && url.hash) {
				const hashParams = new URLSearchParams(url.hash.slice(1))
				const coordsMatch =
					hashParams.get("q") || url.hash.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
				if (coordsMatch) {
					const coords =
						coordsMatch instanceof Array
							? coordsMatch.slice(1)
							: coordsMatch.split(",")
					latitude = parseFloat(coords[0])
					longitude = parseFloat(coords[1])
				}
			}
			name = location
			googleMapsUrl = location
		} else {
			const placesService = new google.maps.places.PlacesService(
				document.createElement("div")
			)
			await new Promise((resolve) => {
				placesService.findPlaceFromQuery(
					{ query: location, fields: ["geometry", "name", "place_id"] },
					(results, status) => {
						if (
							status === google.maps.places.PlacesServiceStatus.OK &&
							results &&
							results[0]?.geometry?.location
						) {
							latitude = results[0].geometry.location.lat()
							longitude = results[0].geometry.location.lng()
							name = results[0].name || location
							googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${results[0].place_id}`
						}
						resolve(null)
					}
				)
			})
		}

		if (
			isNaN(latitude) ||
			isNaN(longitude) ||
			latitude < -90 ||
			latitude > 90 ||
			longitude < -180 ||
			longitude > 180
		) {
			throw new Error(
				"Invalid latitude or longitude values derived from the location."
			)
		}

		return { latitude, longitude, googleMapsUrl, name }
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : "Failed to get location details"
		)
	}
}
