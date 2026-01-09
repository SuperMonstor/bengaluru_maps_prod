"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import dynamic from "next/dynamic"
import "@mdxeditor/editor/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/components/layout/LayoutClient"
import MarkdownEditor from "@/components/markdown/MarkdownEditor"
import { useRouter } from "next/navigation"
import { createMapAction } from "@/lib/supabase/api/createMapAction"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/lib/hooks/use-toast"
import { LoadingIndicator } from "@/components/custom-ui/loading-indicator"
import { slugify, validateSlug, isReservedSlug } from "@/lib/utils/slugify"
import { CREATE_MAP_CONTENT } from "@/lib/constants/createMapContent"
import { GoogleMapsListImport } from "@/components/map/GoogleMapsListImport"
import { ParsedLocation } from "@/lib/services/googleMapsListService"
import { bulkImportLocationsAction } from "@/lib/supabase/api/bulkImportLocationsAction"
import MapIdeasModal from "@/components/map/MapIdeasModal"
import MapOwnershipModal from "@/components/map/MapOwnershipModal"
import SimplifiedMarkdownEditor from "@/components/markdown/SimplifiedMarkdownEditor"

const MDXEditorDynamic = dynamic(
	() => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
	{
		ssr: false,
		loading: () => <LoadingIndicator />,
	}
)

interface CreateMapForm {
	title: string
	slug: string
	shortDescription: string
	body: string
	displayPicture?: FileList
}

export default function CreateMapPage() {
	const { user } = useUser()
	const router = useRouter()
	const { toast } = useToast()
	const [markdownValue, setMarkdownValue] = useState<string>("")
	const [imagePreview, setImagePreview] = useState<string>("")
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const [charCount, setCharCount] = useState<number>(0)
	const [slugStatus, setSlugStatus] = useState<{
		checking: boolean
		available: boolean | null
		message: string
	}>({ checking: false, available: null, message: "" })
	const [userEditedSlug, setUserEditedSlug] = useState(false)
	const [locationsToImport, setLocationsToImport] = useState<ParsedLocation[]>([])
	const [lastError, setLastError] = useState<string | null>(null)
	const [mapIdeasModalOpen, setMapIdeasModalOpen] = useState(false)
	const [showOwnershipModal, setShowOwnershipModal] = useState(false)
	const [pendingFormData, setPendingFormData] = useState<CreateMapForm | null>(null)
	const [isMobile, setIsMobile] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<CreateMapForm>()

	// Watch for file changes, title, slug, and short description
	const displayPicture = watch("displayPicture")
	const title = watch("title")
	const slug = watch("slug")
	const shortDescription = watch("shortDescription")

	// Mobile detection with debounce
	useEffect(() => {
		let timeoutId: NodeJS.Timeout
		const checkMobile = () => {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => setIsMobile(window.innerWidth < 768), 150)
		}
		checkMobile()
		window.addEventListener("resize", checkMobile)
		return () => {
			clearTimeout(timeoutId)
			window.removeEventListener("resize", checkMobile)
		}
	}, [])

	// Auto-generate slug from title with debounce
	useEffect(() => {
		if (!title) return

		const timer = setTimeout(() => {
			if (!userEditedSlug) {
				const generatedSlug = slugify(title)
				setValue("slug", generatedSlug)
			}
		}, 500) // Wait 500ms after user stops typing

		return () => clearTimeout(timer)
	}, [title, userEditedSlug, setValue])

	// Check slug availability with debounce
	useEffect(() => {
		if (!slug || slug.length === 0) {
			setSlugStatus({ checking: false, available: null, message: "" })
			return
		}

		// Validate format first
		const validation = validateSlug(slug)
		if (!validation.valid) {
			setSlugStatus({
				checking: false,
				available: false,
				message: validation.error || "Invalid slug format",
			})
			return
		}

		// Check if reserved
		if (isReservedSlug(slug)) {
			setSlugStatus({
				checking: false,
				available: false,
				message: "This URL is reserved",
			})
			return
		}

		setSlugStatus({ checking: true, available: null, message: "Checking..." })

		const timer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`)
				const data = await response.json()

				if (data.available) {
					setSlugStatus({
						checking: false,
						available: true,
						message: "Available!",
					})
				} else {
					setSlugStatus({
						checking: false,
						available: false,
						message: "This URL is already taken",
					})
				}
			} catch (error) {
				console.error("Error checking slug:", error)
				setSlugStatus({
					checking: false,
					available: null,
					message: "",
				})
			}
		}, 500) // Debounce 500ms

		return () => clearTimeout(timer)
	}, [slug])

	// Update character count when short description changes
	useEffect(() => {
		if (shortDescription) {
			setCharCount(shortDescription.length)
		} else {
			setCharCount(0)
		}
	}, [shortDescription])

	// Get max length from constants
	const maxDescriptionLength = CREATE_MAP_CONTENT.form.shortDescription.maxLength

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

	const onSubmit: SubmitHandler<CreateMapForm> = (data) => {
		setPendingFormData(data)
		setShowOwnershipModal(true)
	}

	const handleConfirmOwnership = async () => {
		if (!pendingFormData || !user) {
			router.push("/login")
			return
		}

		setShowOwnershipModal(false)
		setIsSubmitting(true)
		setLastError(null)

		try {
			// Create FormData for server action
			const formData = new FormData()
			formData.append("title", pendingFormData.title)
			formData.append("slug", pendingFormData.slug)
			formData.append("shortDescription", pendingFormData.shortDescription)
			formData.append("body", pendingFormData.body)
			formData.append("displayPicture", pendingFormData.displayPicture![0])

			const result = await createMapAction(formData)

			if (!result.success) {
				const errorMsg = result.error || "An unexpected error occurred"
				console.error("Error creating map:", errorMsg)
				setLastError(errorMsg)
				toast({
					variant: "destructive",
					title: "Error creating map",
					description: errorMsg,
				})
				setIsSubmitting(false)
			} else {
				// If there are locations to import, do it now
				if (locationsToImport.length > 0 && result.data?.id) {
					try {
						const importResult = await bulkImportLocationsAction(
							result.data.id,
							locationsToImport
						)
						if (importResult.imported > 0) {
							toast({
								title: "Success!",
								description: `Your map has been created with ${importResult.imported} locations imported.`,
							})
						} else {
							toast({
								title: "Success!",
								description: "Your map has been created.",
							})
						}
					} catch (importError) {
						console.error("Error importing locations:", importError)
						toast({
							title: "Map Created",
							description: "Your map was created but some locations failed to import.",
						})
					}
				} else {
					toast({
						title: "Success!",
						description: "Your map has been created.",
					})
				}

				// Increase the delay to ensure the upvote is processed
				setTimeout(() => {
					// If we have the map data, redirect to the map page instead of home
					if (result.data && result.data.slug) {
						router.push(
							`/maps/${result.data.slug}?expand=true`
						)
					} else {
						router.push("/")
					}
					router.refresh()
				}, 1000)
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err)
			console.error("Unexpected error:", err)
			setLastError(errorMsg)
			toast({
				variant: "destructive",
				title: "Error",
				description: errorMsg,
			})
			setIsSubmitting(false)
		}
	}

	if (!user) {
		router.push("/login")
		return null
	}

	const copyErrorToClipboard = () => {
		if (lastError) {
			navigator.clipboard.writeText(lastError)
			toast({
				title: "Copied!",
				description: "Error message copied to clipboard",
			})
		}
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] p-3 md:p-4 bg-white">
			<section className="max-w-2xl mx-auto space-y-4 md:space-y-8">
				<header>
					<h1 className="text-xl md:text-2xl font-bold text-gray-900">{CREATE_MAP_CONTENT.title}</h1>
					<p className="text-sm md:text-base text-gray-600 mt-2">
						{CREATE_MAP_CONTENT.subtitle}
					</p>
				</header>

				{lastError && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<h3 className="font-semibold text-red-900 mb-1">Error Details</h3>
								<p className="text-sm text-red-700 break-words font-mono">{lastError}</p>
							</div>
							<button
								onClick={copyErrorToClipboard}
								className="flex-shrink-0 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded whitespace-nowrap transition-colors"
							>
								Copy Error
							</button>
						</div>
					</div>
				)}

				<div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-100">
					<div className="flex items-center justify-between">
						<h2 className="text-sm md:text-base font-semibold text-blue-800">
							Need ideas for your map?
						</h2>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setMapIdeasModalOpen(true)}
							className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 text-xs md:text-sm"
						>
							View Ideas
						</Button>
					</div>
					<p className="text-xs md:text-sm text-blue-700 mt-1">
						Click to see popular map ideas from the community
					</p>
				</div>

				{/* Google Maps List Import */}
				<GoogleMapsListImport
					previewMode={true}
					onLocationsChange={setLocationsToImport}
				/>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
					<div className="space-y-2">
						<label
							htmlFor="title"
							className="text-xs md:text-sm font-medium text-gray-700"
						>
							{CREATE_MAP_CONTENT.form.title.label} *
						</label>
						<Input
							{...register("title", { required: "Title is required" })}
							id="title"
							placeholder={CREATE_MAP_CONTENT.form.title.placeholder}
							className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
							defaultValue=""
						/>
						{errors.title && (
							<p className="text-sm text-red-500">{errors.title.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<label
							htmlFor="slug"
							className="text-xs md:text-sm font-medium text-gray-700"
						>
							{CREATE_MAP_CONTENT.form.slug.label} *
						</label>
						<p className="text-xs md:text-sm text-gray-500">
							{CREATE_MAP_CONTENT.form.slug.description}
							<span className="font-semibold">{slug || "your-slug"}</span>
						</p>
						<div className="relative">
							<Input
								{...register("slug", {
									required: "URL slug is required",
									validate: {
										format: (value) => {
											const validation = validateSlug(value)
											return validation.valid || validation.error || "Invalid slug"
										},
										notReserved: (value) =>
											!isReservedSlug(value) ||
											"This URL is reserved. Please choose a different one.",
									},
									onChange: () => {
										setUserEditedSlug(true)
									},
								})}
								id="slug"
								placeholder={CREATE_MAP_CONTENT.form.slug.placeholder}
								className={`w-full border rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:ring-1 pr-10 ${
									slugStatus.available === true
										? "border-green-500 focus:border-green-500 focus:ring-green-500"
										: slugStatus.available === false
											? "border-red-500 focus:border-red-500 focus:ring-red-500"
											: "border-gray-300 focus:border-gray-500 focus:ring-gray-500"
								}`}
							/>
							{slugStatus.checking && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
								</div>
							)}
							{!slugStatus.checking && slugStatus.available === true && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
									✓
								</div>
							)}
							{!slugStatus.checking && slugStatus.available === false && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
									✗
								</div>
							)}
						</div>
						{slugStatus.message && (
							<p
								className={`text-sm ${
									slugStatus.available === true
										? "text-green-600"
										: slugStatus.available === false
											? "text-red-500"
											: "text-gray-500"
								}`}
							>
								{slugStatus.message}
							</p>
						)}
						{errors.slug && (
							<p className="text-sm text-red-500">{errors.slug.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label
								htmlFor="shortDescription"
								className="text-xs md:text-sm font-medium text-gray-700"
							>
								{CREATE_MAP_CONTENT.form.shortDescription.label} *
							</label>
							<span
								className={`text-sm md:text-base font-semibold ${
									charCount > maxDescriptionLength
										? "text-red-600"
										: charCount > maxDescriptionLength * 0.9
											? "text-orange-500"
											: "text-gray-600"
								}`}
							>
								{charCount}/{maxDescriptionLength}
							</span>
						</div>
						<p className="text-xs md:text-sm text-gray-500">
							{CREATE_MAP_CONTENT.form.shortDescription.description}
						</p>
						<Textarea
							{...register("shortDescription", {
								required: "Short description is required",
								maxLength: {
									value: maxDescriptionLength,
									message: `Short description must be ${maxDescriptionLength} characters or less`,
								},
							})}
							id="shortDescription"
							placeholder={CREATE_MAP_CONTENT.form.shortDescription.placeholder}
							className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 h-24"
							defaultValue=""
							maxLength={maxDescriptionLength}
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
							className="text-xs md:text-sm font-medium text-gray-700"
						>
							Display Picture *
						</label>
						<p className="text-xs md:text-sm text-gray-500">
							16:9 aspect ratio recommended for best display
						</p>
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
						<label htmlFor="body" className="text-xs md:text-sm font-medium text-gray-700">
							{CREATE_MAP_CONTENT.form.body.label}
						</label>
						<div className="text-sm text-gray-500 space-y-2 mb-3">
							<p>{CREATE_MAP_CONTENT.chatGPTPrompt.title}</p>
							<div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs">
								<p className="font-medium whitespace-pre-line">
									{CREATE_MAP_CONTENT.chatGPTPrompt.template}
								</p>
							</div>
							<p className="text-xs mt-1">
								{CREATE_MAP_CONTENT.chatGPTPrompt.helpText}
							</p>
						</div>
						{isMobile ? (
							<SimplifiedMarkdownEditor
								value={markdownValue}
								onChange={(markdown) => {
									setMarkdownValue(markdown)
									setValue("body", markdown, { shouldValidate: true })
								}}
								placeholder={CREATE_MAP_CONTENT.form.body.placeholder}
							/>
						) : (
							<MarkdownEditor
								value={markdownValue}
								onChange={(markdown) => {
									setMarkdownValue(markdown)
									setValue("body", markdown, { shouldValidate: true })
								}}
								placeholder={CREATE_MAP_CONTENT.form.body.placeholder}
								className="mdxeditor"
							/>
						)}
						{errors.body && (
							<p className="text-sm text-red-500">{errors.body.message}</p>
						)}
					</div>

					<Button
						type="submit"
						className="w-full bg-[#FF6A00] hover:bg-[#E55F00] text-white rounded-md py-2 transition-colors"
						disabled={isSubmitting || charCount > maxDescriptionLength}
					>
						{isSubmitting ? (
							<div className="flex items-center justify-center">
								<span className="mr-2">{CREATE_MAP_CONTENT.buttons.submitting}</span>
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
							CREATE_MAP_CONTENT.buttons.submit
						)}
					</Button>
				</form>

				<MapIdeasModal
					isOpen={mapIdeasModalOpen}
					onOpenChange={setMapIdeasModalOpen}
				/>

				<MapOwnershipModal
					isOpen={showOwnershipModal}
					onOpenChange={(open) => {
						if (!isSubmitting) setShowOwnershipModal(open)
					}}
					onConfirm={handleConfirmOwnership}
					isSubmitting={isSubmitting}
				/>
			</section>
		</main>
	)
}
