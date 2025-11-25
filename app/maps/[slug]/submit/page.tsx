"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useUser } from "@/components/layout/LayoutClient"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useLoadScript } from "@react-google-maps/api"
import { SubmitHandler, useForm, FieldValues } from "react-hook-form"
import {
	Combobox,
	ComboboxInput,
	ComboboxPopover,
	ComboboxList,
	ComboboxOption,
} from "@/components/ui/combobox"
import { useToast } from "@/lib/hooks/use-toast"
import { LocationSuggestion, SubmitLocationProps } from "@/lib/types/mapTypes"
import { getMapBySlug } from "@/lib/supabase/mapsService"
import { createLocation } from "@/lib/supabase/mapsService"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { slugify, isReservedSlug } from "@/lib/utils/slugify"
import { use } from "react"

// Make geometry and other fields optional in LocationSuggestion for initial suggestions
type PartialLocationSuggestion = Partial<LocationSuggestion> & {
	place_id: string
	description: string
	structured_formatting: google.maps.places.StructuredFormatting
}

export default function SubmitLocationPage({ params }: SubmitLocationProps) {
	// Unwrap the params Promise
	const resolvedParams = use(params)
	const mapSlug = resolvedParams.slug

	const { toast } = useToast()
	const { user } = useUser()
	const router = useRouter()
	const [map, setMap] = useState<any>(null)
	const [error, setError] = useState<string | null>(null)
	const [suggestions, setSuggestions] = useState<PartialLocationSuggestion[]>(
		[]
	)
	const [selectedLocation, setSelectedLocation] =
		useState<LocationSuggestion | null>(null)
	const [metadata, setMetadata] = useState<{
		name: string
		photos: google.maps.places.PlacePhoto[] | null
		address: string | null
	} | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const { isLoaded } = useLoadScript({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
		libraries: ["places"],
	})

	const {
		control,
		handleSubmit,
		setValue,
		register,
		watch,
		formState: { errors },
	} = useForm<FieldValues>({
		defaultValues: {
			location: "",
			description: "",
		},
	})

	const location = watch("location")

	useEffect(() => {
		// Check if slug is reserved
		if (isReservedSlug(mapSlug)) {
			setError("Invalid map URL")
			return
		}

		async function fetchMap() {
			try {
				const result = await getMapBySlug(mapSlug)
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
	}, [mapSlug])

	// Fetch suggestions with debounce
	useEffect(() => {
		if (!isLoaded || !location) {
			setSuggestions([])
			setMetadata(null)
			return
		}

		const debounce = setTimeout(() => {
			const autocompleteService = new google.maps.places.AutocompleteService()
			autocompleteService.getPlacePredictions(
				{
					input: location,
					types: ["establishment"],
					componentRestrictions: { country: "in" },
					locationBias: {
						radius: 20000,
						center: { lat: 12.9716, lng: 77.5946 },
					},
				},
				(predictions, status) => {
					if (
						status === google.maps.places.PlacesServiceStatus.OK &&
						predictions
					) {
						const basicSuggestions: PartialLocationSuggestion[] =
							predictions.map((prediction) => ({
								place_id: prediction.place_id,
								description: prediction.description,
								structured_formatting: prediction.structured_formatting,
							}))
						setSuggestions(basicSuggestions)
					} else {
						setSuggestions([])
					}
				}
			)
		}, 300)

		return () => clearTimeout(debounce)
	}, [location, isLoaded])

	// Handle location selection with Place Details fetch
	const handleSelectLocation = (description: string) => {
		const selected = suggestions.find((s) => s.description === description)
		if (selected) {
			const placesService = new google.maps.places.PlacesService(
				document.createElement("div")
			)
			placesService.getDetails(
				{
					placeId: selected.place_id,
					fields: [
						"geometry",
						"name",
						"url",
						"photos",
						"formatted_address",
						"place_id",
					],
				},
				(place, status) => {
					if (status === google.maps.places.PlacesServiceStatus.OK && place) {
						const geometry =
							place.geometry?.location?.toJSON() as google.maps.LatLngLiteral
						if (geometry) {
							const detailedSelected: LocationSuggestion = {
								place_id: selected.place_id,
								description: selected.description,
								structured_formatting: selected.structured_formatting,
								geometry,
								name: place.name || selected.description,
								photos: place.photos || [],
								address: place.formatted_address || "",
								url:
									place.url ||
									`https://www.google.com/maps/place/${encodeURIComponent(
										place.name || selected.description
									)}/@${geometry.lat},${geometry.lng},15z`,
							}
							setSelectedLocation(detailedSelected)
							setValue(
								"location",
								detailedSelected.name || detailedSelected.description
							)
							setMetadata({
								name: detailedSelected.name || detailedSelected.description,
								photos: detailedSelected.photos || null,
								address: detailedSelected.address || null,
							})
							setSuggestions([])
						}
					}
				}
			)
		}
	}

	const onSubmit: SubmitHandler<any> = async (data) => {
		if (!user) {
			router.push("/login")
			return
		}

		if (isSubmitting || !map) return

		try {
			setIsSubmitting(true)

			// If we have a selected location from Google Places, use its data
			const locationData = selectedLocation
				? {
						location: selectedLocation.name || data.location,
						place_id: selectedLocation.place_id,
						address: selectedLocation.address || null,
						geometry: selectedLocation.geometry,
				  }
				: { location: data.location }

			const result = await createLocation({
				mapId: map.id,
				creatorId: user.id,
				...locationData,
				description: data.description,
			})

			if (result.error) {
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
				// Check if the location was auto-approved (user is the map owner)
				const isOwner = map.owner_id === user.id

				// Send email notification if not auto-approved
				if (!isOwner && map.owner_email) {
					try {
						console.log("Sending email notification to:", map.owner_email)
						const response = await fetch("/api/email", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								ownerEmail: map.owner_email,
								mapTitle: map.title,
								locationName: locationData.location,
								submitterName: `${user.first_name} ${user.last_name}`,
								mapUrl: `${window.location.origin}/my-maps/${map.id}/pending`,
							}),
						})

						if (!response.ok) {
							const errorText = await response.text()
							console.error("Failed to send email notification:", errorText)
						}
					} catch (emailError) {
						console.error("Error sending email notification:", emailError)
					}
				}

				toast({
					title: "Success!",
					description: isOwner
						? "Your location has been added to the map."
						: "Your location has been submitted and is pending approval.",
				})

				router.push(`/maps/${map.slug || slugify(map.title)}`)
				router.refresh()
			}
		} catch (error) {
			console.error("Error in submission:", error)
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to submit location. Please try again.",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	if (authLoading) {
		return <LoadingIndicator />
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
		return <LoadingIndicator />
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] p-4 bg-background">
			<section className="max-w-2xl mx-auto space-y-8">
				<header>
					<h1 className="text-2xl font-bold text-foreground">
						Submit to Community
					</h1>
					{map.owner_id === user.id && (
						<p className="text-sm text-muted-foreground mt-1">
							As the map owner, your submissions will be automatically approved.
						</p>
					)}
				</header>

				<div className="flex flex-col md:flex-row gap-6 items-start">
					<div className="relative w-full md:w-1/3 aspect-[16/9] overflow-hidden rounded-lg border border-border">
						<Image
							src={map.image}
							alt={`${map.title} Preview`}
							fill
							quality={100}
							priority={true}
							className="object-cover w-full h-full"
						/>
					</div>
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
								className="w-full border border-border rounded-md shadow-sm text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
							/>
							{suggestions.length > 0 && (
								<ComboboxPopover className="bg-background border border-border rounded-md shadow-lg">
									<ComboboxList>
										{suggestions.map((suggestion) => (
											<ComboboxOption
												key={suggestion.place_id}
												value={suggestion.description}
												className="p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
									<div className="w-full aspect-video relative overflow-hidden rounded-md">
										<Image
											src={metadata.photos[0].getUrl({
												maxWidth: 800,
												maxHeight: 800,
											})}
											alt={`${metadata.name} photo`}
											fill
											quality={100}
											priority={true}
											className="object-cover w-full h-full"
										/>
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
							Leave a note about the place (optional)
						</Label>
						<Textarea
							id="description"
							{...register("description", {
								maxLength: {
									value: 60,
									message: "Description must be less than 60 characters",
								},
							})}
							placeholder="Great sushi, awesome vibes (optional)"
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
						) : map.owner_id === user.id ? (
							"Add Location"
						) : (
							"Submit for Approval"
						)}
					</Button>
				</form>
			</section>
		</main>
	)
}
