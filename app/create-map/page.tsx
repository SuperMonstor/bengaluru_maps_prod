"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import dynamic from "next/dynamic"
import "@mdxeditor/editor/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/context/AuthContext"
import MarkdownEditor from "@/components/markdown/MarkdownEditor"
import { useRouter } from "next/navigation"
import { createMap } from "@/lib/supabase/mapsService"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/lib/hooks/use-toast"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"

const MDXEditorDynamic = dynamic(
	() => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
	{
		ssr: false,
		loading: () => <LoadingIndicator />,
	}
)

interface CreateMapForm {
	title: string
	shortDescription: string
	body: string
	displayPicture?: FileList
}

export default function CreateMapPage() {
	const { user, isLoading } = useAuth()
	const router = useRouter()
	const { toast } = useToast()
	const [markdownValue, setMarkdownValue] = useState<string>("")
	const [imagePreview, setImagePreview] = useState<string>("")
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [charCount, setCharCount] = useState<number>(0)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<CreateMapForm>()

	// Watch for file changes and short description
	const displayPicture = watch("displayPicture")
	const shortDescription = watch("shortDescription")

	// Update character count when short description changes
	useEffect(() => {
		if (shortDescription) {
			setCharCount(shortDescription.length)
		} else {
			setCharCount(0)
		}
	}, [shortDescription])

	// Update image preview when file changes
	useEffect(() => {
		if (displayPicture?.[0]) {
			const file = displayPicture[0]
			const reader = new FileReader()
			reader.onloadend = () => {
				setImagePreview(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}, [displayPicture])

	const onSubmit: SubmitHandler<CreateMapForm> = async (data) => {
		if (!user) {
			router.push("/login")
			return
		}

		if (isSubmitting) return // Prevent multiple submissions

		setIsSubmitting(true) // Disable the button immediately

		try {
			const { data: mapData, error } = await createMap({
				title: data.title,
				shortDescription: data.shortDescription,
				body: data.body,
				displayPicture: data.displayPicture![0],
				ownerId: user.id,
			})

			if (error) {
				console.error("Error creating map:", error)
				toast({
					variant: "destructive",
					title: "Error creating map",
					description: error,
				})
				setIsSubmitting(false)
			} else {
				toast({
					title: "Success!",
					description: "Your map has been created.",
				})

				// Increase the delay to ensure the upvote is processed
				setTimeout(() => {
					// If we have the map data, redirect to the map page instead of home
					if (mapData && mapData.id) {
						router.push(
							`/maps/${mapData.slug || "map"}/${mapData.id}?expand=true`
						)
					} else {
						router.push("/")
					}
					router.refresh()
				}, 1000)
			}
		} catch (err) {
			console.error("Unexpected error:", err)
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred. Please try again.",
			})
			setIsSubmitting(false) // Re-enable the button only on error
		}
		// Don't set isSubmitting to false on success - keep the button disabled
		// The page will redirect anyway, so there's no need to re-enable the button
	}

	if (isLoading) {
		return <LoadingIndicator />
	}

	if (!user) {
		router.push("/login")
		return null
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] p-4 bg-white">
			<section className="max-w-2xl mx-auto space-y-8">
				<header>
					<h1 className="text-2xl font-bold text-gray-900">Create Your Map</h1>
					<p className="text-gray-600 mt-2">
						Share your favorite places in Bengaluru with the community.
					</p>
				</header>

				<div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
					<h2 className="font-semibold text-blue-800 mb-2">Map Ideas</h2>
					<p className="text-sm text-blue-700 mb-2">
						Not sure what to create? Here are some popular map ideas:
					</p>
					<ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
						<li>
							Pet-Friendly Spots – Cafes, parks, and restaurants that welcome
							pets
						</li>
						<li>
							Startup & Co-Working Spaces – Work-friendly cafes and coworking
							spaces with strong Wi-Fi
						</li>
						<li>
							First Date Spots – Places perfect for a first date, categorized by
							vibe
						</li>
						<li>
							Book Lovers' Map – The best bookstores, reading cafés, and quiet
							nooks
						</li>
						<li>
							Gaming & Esports Hubs – Gaming cafes, VR arcades, and esports
							lounges
						</li>
					</ul>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<label
							htmlFor="title"
							className="text-sm font-medium text-gray-700"
						>
							Title *
						</label>
						<Input
							{...register("title", { required: "Title is required" })}
							id="title"
							placeholder="e.g., Best Biriyani Spots in Bengaluru"
							className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
							defaultValue=""
						/>
						{errors.title && (
							<p className="text-sm text-red-500">{errors.title.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<div className="flex justify-between">
							<label
								htmlFor="shortDescription"
								className="text-sm font-medium text-gray-700"
							>
								Short Description *
							</label>
							<span
								className={`text-xs ${
									charCount > 60 ? "text-red-500" : "text-gray-500"
								}`}
							>
								{charCount}/60 characters
							</span>
						</div>
						<p className="text-xs text-gray-500">
							A one-liner about the map that will appear in search results and
							previews.
						</p>
						<Textarea
							{...register("shortDescription", {
								required: "Short description is required",
								maxLength: {
									value: 60,
									message: "Short description must be 60 characters or less",
								},
							})}
							id="shortDescription"
							placeholder="Brief description of your map (max 60 characters)"
							className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 h-24"
							defaultValue=""
							maxLength={60}
						/>
						{errors.shortDescription && (
							<p className="text-sm text-red-500">
								{errors.shortDescription.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<label
							htmlFor="displayPicture"
							className="text-sm font-medium text-gray-700"
						>
							Display Picture (16:9 recommended) *
						</label>
						<Input
							type="file"
							accept="image/*"
							{...register("displayPicture", {
								required: "Display picture is required",
								validate: {
									hasFile: (files) =>
										(files && files.length > 0) || "Display picture is required",
								},
							})}
							id="displayPicture"
							className="w-full border border-gray-300 rounded-md shadow-sm"
						/>
						{errors.displayPicture && (
							<p className="text-sm text-red-500">
								{errors.displayPicture.message}
							</p>
						)}
						{imagePreview && (
							<div className="aspect-video relative overflow-hidden rounded-lg">
								<img
									src={imagePreview}
									alt="Preview"
									className="object-cover w-full h-full"
								/>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<label htmlFor="body" className="text-sm font-medium text-gray-700">
							Body (Describe what this map is about in detail)
						</label>
						<div className="text-sm text-gray-500 space-y-2 mb-3">
							<p>Need help? Copy this prompt for ChatGPT:</p>
							<div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
								<p className="font-medium">
									Write a description for my Bengaluru map about [YOUR MAP
									TOPIC] in markdown. Include:
								</p>
								<ol className="list-decimal pl-5 mt-1">
									<li>Brief introduction explaining the purpose of this map</li>
									<li>What makes a good location for this collection</li>
									<li>Submission guidelines (photos, details required)</li>
									<li>Criteria for approving submissions</li>
								</ol>
							</div>
							<p className="text-xs mt-1">
								Format with: # for headers, * for lists, **bold** for emphasis
							</p>
						</div>
						<MarkdownEditor
							value={markdownValue}
							onChange={(markdown) => {
								setMarkdownValue(markdown)
								setValue("body", markdown, { shouldValidate: true })
							}}
							placeholder="Describe your map here using Markdown"
							className="mdxeditor"
						/>
						{errors.body && (
							<p className="text-sm text-red-500">{errors.body.message}</p>
						)}
					</div>

					<div className="bg-amber-50 p-4 rounded-lg border border-amber-100 my-6">
						<h2 className="font-semibold text-amber-800 mb-2">Map Ownership</h2>
						<p className="text-sm text-amber-700">
							You get some pretty sweet priviliges as a map creator:
						</p>
						<ul className="text-sm text-amber-700 list-disc pl-5 space-y-1 mt-2">
							<li>Locations will only be added on your approval</li>
							<li>
								You get to determine the quality and relevance of locations on
								your map
							</li>
							<li>You set guidelines for what should be included</li>
						</ul>
						<p className="text-sm text-amber-700 mt-2">
							By submitting this form, you agree to take on these
							responsibilities.
						</p>
					</div>

					<Button
						type="submit"
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2"
						disabled={isSubmitting || isLoading || charCount > 60}
					>
						{isSubmitting ? (
							<div className="flex items-center justify-center">
								<span className="mr-2">Creating Map...</span>
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
							</div>
						) : (
							"Submit"
						)}
					</Button>
				</form>
			</section>
		</main>
	)
}
