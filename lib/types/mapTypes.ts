export interface MapSchema {
	title: string
	shortDescription: string
	body: string
	displayPicture?: File
	ownerId: string
}

export interface MapDatabase {
	id: string
	title: string
	description: string
	body: string
	image: string
	locations: number
	contributors: number
	upvotes: number
	username: string
	userProfilePicture: string | null
}

export interface Location {
	id: string
	map_id: string
	creator_id: string
	name: string
	latitude: number
	longitude: number
	google_maps_url: string
	note: string | null
	created_at: string
	is_approved: boolean
	status: "pending" | "approved" | "rejected"
}

export interface Submission {
	id: string
	map_id: string
	name: string
	google_maps_url: string
	note: string | null
	image_url: string | null
	rating: number | null
	address: string | null
	submitted_by: {
		first_name: string | null
		last_name: string | null
		picture_url: string | null
	}
}

export interface MapData {
	id: string
	name: string
	short_description: string
	body: string
	display_picture: string | null
	owner_id: string
	created_at: string
	users: import("./userTypes").User
	locations: Location[]
	votes: { id: string; user_id: string }[]
	has_upvoted: { user_id: string }[]
}

export interface MapResponse {
	id: string
	title: string
	description: string
	image: string
	locations: number
	contributors: number
	upvotes: number
	hasUpvoted: boolean
	username: string
	userProfilePicture: string | null
	owner_id?: string
}

export interface MapsResult {
	data: MapResponse[]
	total: number
	page: number
	limit: number
	error: string | null
}

export interface CreateMapResult {
	data: any
	error: string | null
}

export interface CreateLocationResult {
	data: any
	error: string | null
}

export interface UserMap {
	id: string
	title: string
	description: string
	body: string
	image: string
	locations: Location[]
	contributors: number
	upvotes: number
	username: string
	userProfilePicture: string | null
	pendingCount: number
	owner_id?: string
}

export interface LocationSuggestion {
	place_id: string
	description: string
	geometry: google.maps.LatLngLiteral
	structured_formatting?: {
		main_text: string
		secondary_text: string
	}
	url?: string
	name?: string
	photos?: google.maps.places.PlacePhoto[]
	address?: string
}

export interface SubmitLocationProps {
	params: Promise<{ mapId: string }>
}
