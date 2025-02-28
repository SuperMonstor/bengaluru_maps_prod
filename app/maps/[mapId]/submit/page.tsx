"use client"

import { getMapById } from "@/lib/supabase/mapsService"
import { Button } from "@/components/ui/button"
import { createLocation } from "@/lib/supabase/mapsService"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useAuth } from "@/lib/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { useLoadScript } from "@react-google-maps/api"
import {
	SubmitHandler,
	useForm,
	FieldValues,
	RegisterOptions,
} from "react-hook-form"
import {
	Combobox,
	ComboboxInput,
	ComboboxPopover,
	ComboboxList,
	ComboboxOption,
} from "@reach/combobox"
import "@reach/combobox/styles.css"
import {} from "@googlemaps/js-api-loader"
import { useToast } from "@/lib/hooks/use-toast"
import { LocationSuggestion, SubmitLocationProps } from "@/lib/types/mapTypes"
import { createClient } from "@/lib/supabase/api/supabaseClient"

export default function SubmitLocationPage({ params }: SubmitLocationProps) {
	// Unwrap params using React.use()
	const resolvedParams = use(params)
	const mapId = resolvedParams.mapId
	const { toast } = useToast()
	const { user, isLoading: authLoading } = useAuth()
	const router = useRouter()
	const [map, setMap] = useState<any>(null) // State to hold map data
	const [error, setError] = useState<string | null>(null)
	const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
	const [selectedLocation, setSelectedLocation] =
		useState<LocationSuggestion | null>(null)
	const [metadata, setMetadata] = useState<{
		name: string
		photos: google.maps.places.PlacePhoto[] | null
		address: string | null
	} | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false) // Add loading state for form submission

	const { isLoaded } = useLoadScript({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
		libraries: ["places"],
	})

	const supabase = createClient()

	const {
		control,
		handleSubmit,
		setValue,
		register,
		watch,
		formState: { errors },
	} = useForm<FieldValues>({
		defaultValues: {
			location: "", // User-friendly location input
			description: "",
		},
	})

	const location = watch("location")

	useEffect(() => {
		async function fetchMap() {
			try {
				const result = await getMapById(mapId)
				if (result.error || !result.data) {
					setError(result.error || "Map not found")
				} else {
					setMap(result.data)
				}
			} catch (err) {
				setError("An unexpected error occurred while fetching the map.")
				console.error("Error fetching map:", err)
			}
		}

		fetchMap()
	}, [mapId])

	// Fetch suggestions as the user types
	useEffect(() => {
		if (!isLoaded || !location) {
			setSuggestions([])
			setMetadata(null)
			return
		}

		const autocompleteService = new google.maps.places.AutocompleteService()
		autocompleteService.getPlacePredictions(
			{
				input: location,
				types: ["establishment"], // Limit to places like businesses, cafes, etc.
				componentRestrictions: { country: "in" }, // Restrict to India (Bengaluru)
				locationBias: {
					radius: 20000, // 20km radius
					center: { lat: 12.9716, lng: 77.5946 }, // Bengaluru coordinates (adjust as needed)
				},
			},
			async (predictions, status) => {
				if (
					status === google.maps.places.PlacesServiceStatus.OK &&
					predictions
				) {
					const placesService = new google.maps.places.PlacesService(
						document.createElement("div")
					)
					const detailedSuggestions: LocationSuggestion[] = []

					for (const prediction of predictions) {
						await new Promise((resolve) => {
							placesService.getDetails(
								{
									placeId: prediction.place_id,
									fields: [
										"geometry",
										"name",
										"url",
										"photos",
										"formatted_address",
									],
								}, // Added photos and formatted_address for metadata
								(place, status) => {
									if (
										status === google.maps.places.PlacesServiceStatus.OK &&
										place
									) {
										const geometry =
											place.geometry?.location?.toJSON() as google.maps.LatLngLiteral // Use toJSON() for LatLngLiteral
										if (geometry) {
											detailedSuggestions.push({
												place_id: prediction.place_id,
												description: prediction.description,
												geometry,
												structured_formatting: prediction.structured_formatting,
												url:
													place.url ||
													`https://www.google.com/maps/place/${encodeURIComponent(
														prediction.description.replace(/ /g, "+")
													)}/@${geometry.lat},${geometry.lng},15z`,
												name: place.name,
												photos: place.photos || [],
												address: place.formatted_address || "",
											})
										}
									}
									resolve(null)
								}
							)
						})
					}

					setSuggestions(detailedSuggestions)
				} else {
					setSuggestions([])
				}
			}
		)
	}, [location, isLoaded])

	// Handle location selection
	const handleSelectLocation = (description: string) => {
		const selected = suggestions.find((s) => s.description === description)
		if (selected) {
			setSelectedLocation(selected)
			setValue("location", selected.name || selected.description) // Show place name in the textbox
			setMetadata({
				name: selected.name || selected.description,
				photos: selected.photos || null,
				address: selected.address || null,
			})
			setSuggestions([]) // Clear suggestions after selection
		}
	}
	const onSubmit: SubmitHandler<any> = async (data) => {
		if (!user) {
			router.push("/login")
			return
		}

		// Prevent multiple submissions
		if (isSubmitting) return

		try {
			setIsSubmitting(true)

			const result = await createLocation({
				mapId,
				creatorId: user.id,
				location: data.location,
				description: data.description,
			})

			if (result.error) {
				// Check if the error is about a duplicate
				if (result.error.includes("already been added")) {
					toast({
						variant: "destructive",
						title: "Duplicate Location",
						description: result.error,
					})
				} else {
					console.error("Error creating location:", result.error)
					toast({
						variant: "destructive",
						title: "Error submitting location",
						description: result.error,
					})
				}
			} else {
				toast({
					title: "Success!",
					description: "Your location has been submitted to the community.",
				})
				router.push(`/maps/${mapId}`)
				router.refresh()
			}
		} catch (err) {
			console.error("Unexpected error:", err)
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred. Please try again.",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	if (authLoading) {
		return <div>Loading...</div>
	}

	if (!user) {
		router.push("/login")
		return null
	}

	if (error) {
		return (
			<main className="min-h-[calc(100vh-4rem)] p-4 bg-background">
				<div className="container mx-auto px-4 py-8">
					<p className="text-destructive">{error}</p>
				</div>
			</main>
		)
	}

	if (!map) {
		return <div>Loading map data...</div>
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] p-4 bg-background">
			<section className="max-w-2xl mx-auto space-y-8">
				<header>
					<h1 className="text-2xl font-bold text-foreground">
						Submit to Community
					</h1>
				</header>

				<div className="flex flex-col md:flex-row gap-6 items-start">
					{/* Map Image (Left, 1/3 width on desktop, full width on mobile) */}
					<div className="relative w-full md:w-1/3 aspect-[16/9] overflow-hidden rounded-lg border border-border">
						<Image
							src={map.image}
							alt={`${map.title} Preview`}
							fill
							className="object-cover"
						/>
					</div>

					{/* Title and Description (Right, 2/3 width on desktop, full width on mobile) */}
					<div className="w-full md:w-2/3 space-y-2">
						<h2 className="text-xl font-semibold text-foreground">
							{map.title}
						</h2>
						<p className="text-md text-muted-foreground">{map.description}</p>
					</div>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-4">
						<Label
							htmlFor="location"
							className="text-sm font-medium text-foreground"
						>
							Location *
						</Label>
						<Combobox
							onSelect={handleSelectLocation}
							aria-labelledby="location"
						>
							<ComboboxInput
								id="location"
								value={location}
								onChange={(e) => setValue("location", e.target.value)}
								placeholder="e.g., Coffee Day Indiranagar"
								className="w-full border border-border rounded-md shadow-sm text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2" // Added padding
							/>
							{suggestions.length > 0 && (
								<ComboboxPopover className="bg-background border border-border rounded-md shadow-lg">
									<ComboboxList>
										{suggestions.map((suggestion) => (
											<ComboboxOption
												key={suggestion.place_id}
												value={suggestion.description}
												className="p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer" // Increased padding
											>
												{suggestion.description}
											</ComboboxOption>
										))}
									</ComboboxList>
								</ComboboxPopover>
							)}
						</Combobox>
						{errors.location && (
							<p className="text-sm text-destructive">
								{errors.location.message?.toString()}
							</p>
						)}
						{selectedLocation && metadata && (
							<div className="mt-4 p-4 bg-card border border-border rounded-md shadow-sm space-y-4">
								<h3 className="text-lg font-semibold text-foreground">
									{metadata.name}
								</h3>
								{metadata.photos && metadata.photos.length > 0 && (
									<div className="flex gap-2">
										{metadata.photos.slice(0, 2).map((photo, index) => (
											<Image
												key={index}
												src={photo.getUrl({ maxWidth: 100, maxHeight: 100 })} // Changed to getUri
												alt={`${metadata.name} photo ${index + 1}`}
												width={100}
												height={100}
												className="object-cover rounded-md"
											/>
										))}
									</div>
								)}
								{metadata.address && (
									<p className="text-sm text-muted-foreground">
										{metadata.address}
									</p>
								)}
							</div>
						)}
					</div>

					<div className="space-y-4">
						<Label
							htmlFor="description"
							className="text-sm font-medium text-foreground"
						>
							Leave a note about the place (the funnier the better)
						</Label>
						<Textarea
							id="description"
							{...register("description", {
								required: "Description is required",
								maxLength: {
									value: 60,
									message: "Description must be less than 60 characters",
								},
							} as RegisterOptions)}
							placeholder="Great sushi, awesome vibes"
							className="w-full border border-border rounded-md shadow-sm text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary h-24 px-3 py-2"
						/>
						<div className="flex justify-between">
							{errors.description && (
								<p className="text-sm text-destructive">
									{errors.description.message?.toString()}
								</p>
							)}
							<span
								className={`text-xs ${
									(watch("description")?.length || 0) > 60
										? "text-destructive"
										: "text-muted-foreground"
								}`}
							>
								{watch("description")?.length || 0}/60
							</span>
						</div>
					</div>
					{/* 
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Do you love working from coffee shops, hotels, and libraries? Help
							us build the biggest crowd-sourced list of work-friendly cafés on
							Google Maps. All of these places have wi-fi and seating. See the
							notes for how busy it gets or if they have no laptop policies.
						</p>
					</div> */}

					<Button
						type="submit"
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2"
						disabled={isSubmitting || authLoading}
					>
						{isSubmitting ? (
							<>
								<span className="mr-2">Submitting...</span>
								<svg
									className="animate-spin h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							</>
						) : (
							"Submit"
						)}
					</Button>
				</form>
			</section>
		</main>
	)
}
