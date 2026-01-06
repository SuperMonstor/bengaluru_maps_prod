export interface MapSchema {
	title: string
	shortDescription: string
	body: string
	displayPicture?: File
	ownerId: string
	city?: string
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
	city: string
	upvotes?: number
	hasUpvoted?: boolean
	distance?: number
	user_username?: string
	user_avatar?: string | null
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
	slug?: string
	vote_count?: number
	username?: string
	user_picture?: string | null
	city: string
	invite_token?: string | null
}

export interface MapResponse {
	id: string
	title: string
	description: string
	image: string
	locations: number
	contributors: Contributor[]
	upvotes: number
	hasUpvoted: boolean
	owner_id?: string
	slug?: string
	city: string
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
	contributors: Contributor[]
	upvotes: number
	pendingCount: number
	owner_id?: string
	slug?: string
	city: string
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
	params: Promise<{ slug: string; id: string }>
}

export interface MapUI {
	id: string
	title: string
	description: string
	body: string
	image: string
	locations: Location[]
	contributors: Contributor[]
	upvotes: number
	owner_id?: string
	hasUpvoted: boolean
	slug?: string
}

// Collaborator types
export interface MapCollaborator {
	id: string
	map_id: string
	user_id: string
	role: "editor"
	joined_at: string
	// Joined user data (when fetched with user details)
	user?: {
		id: string
		first_name: string | null
		last_name: string | null
		picture_url: string | null
	}
}

export interface CollaboratorWithUser extends MapCollaborator {
	user: {
		id: string
		first_name: string | null
		last_name: string | null
		picture_url: string | null
	}
}

export interface Contributor {
	id: string
	full_name: string
	picture_url: string | null
	is_owner: boolean
}

