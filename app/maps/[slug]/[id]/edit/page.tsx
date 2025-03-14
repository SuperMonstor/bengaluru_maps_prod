"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"
import { getMapById } from "@/lib/supabase/mapsService"
import { updateMapAction } from "@/lib/supabase/api/updateMapAction"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/lib/hooks/use-toast"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import Image from "next/image"
import { slugify } from "@/lib/utils/slugify"
import { use } from "react"

interface EditMapPageProps {
	params: Promise<{ slug: string; id: string }>
}

export default function EditMapPage({ params }: EditMapPageProps) {
	// Unwrap the params Promise
	const resolvedParams = use(params)
	const mapId = resolvedParams.id

	const { user, isLoading: authLoading } = useAuth()
	const router = useRouter()
	const { toast } = useToast()
	const [map, setMap] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [formData, setFormData] = useState({
		title: "",
		shortDescription: "",
		body: "",
	})
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [previewImage, setPreviewImage] = useState<string | null>(null)

	// Fetch map data
	useEffect(() => {
		async function fetchMap() {
			try {
				const { data, error } = await getMapById(mapId, user?.id)
				if (error || !data) {
					setError(error || "Map not found")
					return
				}

				// Check if user is the owner
				if (user?.id !== data.owner_id) {
					setError("You don't have permission to edit this map")
					return
				}

				setMap(data)
				setFormData({
					title: data.title,
					shortDescription: data.description,
					body: data.body,
				})
				setPreviewImage(data.image)
			} catch (err) {
				console.error("Error fetching map:", err)
				setError("An unexpected error occurred")
			} finally {
				setLoading(false)
			}
		}

		if (user) {
			fetchMap()
		} else if (!authLoading) {
			router.push("/login")
		}
	}, [mapId, user, authLoading, router])

	// Handle form input changes
	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	// Handle image upload
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setImageFile(file)

			// Create preview
			const reader = new FileReader()
			reader.onload = (event) => {
				setPreviewImage(event.target?.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!user || !map) return

		try {
			setSubmitting(true)

			// Create form data for server action
			const formDataObj = new FormData()
			formDataObj.append("mapId", map.id)
			formDataObj.append("title", formData.title)
			formDataObj.append("shortDescription", formData.shortDescription)
			formDataObj.append("body", formData.body)

			if (imageFile) {
				formDataObj.append("displayPicture", imageFile)
			}

			const result = await updateMapAction(formDataObj)

			if (result.success && result.data) {
				toast({
					title: "Success!",
					description: "Map updated successfully",
				})

				// Redirect to the updated map page
				const newSlug = result.data.slug || slugify(result.data.title)
				router.push(`/maps/${newSlug}/${result.data.id}`)
				router.refresh()
			} else {
				toast({
					variant: "destructive",
					title: "Error",
					description: result.error || "Failed to update map",
				})
			}
		} catch (err) {
			console.error("Error updating map:", err)
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred",
			})
		} finally {
			setSubmitting(false)
		}
	}

	if (authLoading || loading) {
		return <LoadingIndicator />
	}

	if (error) {
		return (
			<main className="min-h-screen bg-gray-50/50 p-4">
				<div className="container mx-auto max-w-3xl py-8">
					<div className="bg-white p-6 rounded-lg shadow-sm">
						<h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
						<p className="text-gray-700">{error}</p>
						<Button className="mt-4" onClick={() => router.back()}>
							Go Back
						</Button>
					</div>
				</div>
			</main>
		)
	}

	if (!map) {
		return <LoadingIndicator />
	}

	return (
		<main className="min-h-screen bg-gray-50/50 p-4">
			<div className="container mx-auto max-w-3xl py-8">
				<div className="bg-white p-6 rounded-lg shadow-sm">
					<h1 className="text-2xl font-bold mb-6">Edit Map</h1>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								required
								placeholder="Map title"
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="shortDescription">Short Description</Label>
							<Textarea
								id="shortDescription"
								name="shortDescription"
								value={formData.shortDescription}
								onChange={handleInputChange}
								required
								placeholder="A brief description of your map"
								className="w-full h-20"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="body">Content</Label>
							<Textarea
								id="body"
								name="body"
								value={formData.body}
								onChange={handleInputChange}
								required
								placeholder="Detailed information about your map"
								className="w-full h-40"
							/>
							<p className="text-xs text-muted-foreground">
								Supports Markdown formatting
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="displayPicture">Cover Image</Label>
							<div className="flex items-start gap-4">
								{previewImage && (
									<div className="relative w-32 h-24 overflow-hidden rounded-md border border-gray-200">
										<Image
											src={previewImage}
											alt="Map preview"
											fill
											className="object-cover"
										/>
									</div>
								)}
								<div className="flex-1">
									<Input
										id="displayPicture"
										name="displayPicture"
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="w-full"
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Leave empty to keep the current image
									</p>
								</div>
							</div>
						</div>

						<div className="flex justify-end gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.back()}
								disabled={submitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={submitting}>
								{submitting ? "Updating..." : "Update Map"}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</main>
	)
}
