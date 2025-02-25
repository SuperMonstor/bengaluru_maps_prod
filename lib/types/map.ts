interface MapSchema {
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
