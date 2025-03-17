export const IMAGE_CONFIG = {
	MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
	OPTIMAL_WIDTH: 1920, // 16:9 ratio
	OPTIMAL_HEIGHT: 1080,
	COMPRESSION_QUALITY: 0.8,
	ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const, // Make this a literal type
} as const

// Define accepted MIME types
type AcceptedImageType = (typeof IMAGE_CONFIG.ACCEPTED_TYPES)[number]

// Define upload options interface for better type safety and flexibility
export interface UploadImageOptions {
	bucket?: string
	folder?: string
	contentType?: string
	cacheControl?: string
	upsert?: boolean
	serverSupabase?: any // Optional server-side Supabase client
}

// Helper to check if code is running in browser
const isBrowser = typeof window !== "undefined"

export class ImageProcessor {
	static async compressImage(file: File): Promise<Blob> {
		// If we're in a server environment, return the file as is
		if (!isBrowser) {
			return file
		}

		return new Promise((resolve, reject) => {
			const img = new Image()
			img.src = URL.createObjectURL(file)

			img.onload = () => {
				URL.revokeObjectURL(img.src)
				const canvas = document.createElement("canvas")

				let width = img.width
				let height = img.height

				if (
					width > IMAGE_CONFIG.OPTIMAL_WIDTH ||
					height > IMAGE_CONFIG.OPTIMAL_HEIGHT
				) {
					const ratio = Math.min(
						IMAGE_CONFIG.OPTIMAL_WIDTH / width,
						IMAGE_CONFIG.OPTIMAL_HEIGHT / height
					)
					width = Math.floor(width * ratio)
					height = Math.floor(height * ratio)
				}

				canvas.width = width
				canvas.height = height

				const ctx = canvas.getContext("2d")
				ctx?.drawImage(img, 0, 0, width, height)

				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob)
						} else {
							reject(new Error("Image compression failed"))
						}
					},
					"image/jpeg" as AcceptedImageType,
					IMAGE_CONFIG.COMPRESSION_QUALITY
				)
			}

			img.onerror = () => reject(new Error("Failed to load image"))
		})
	}

	static validateImage(file: File): { isValid: boolean; error?: string } {
		const fileType = file.type as AcceptedImageType

		if (!IMAGE_CONFIG.ACCEPTED_TYPES.includes(fileType)) {
			return {
				isValid: false,
				error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
			}
		}

		if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE * 2) {
			return {
				isValid: false,
				error: "Image is too large. Please select an image under 10MB",
			}
		}

		return { isValid: true }
	}

	static generateFileName(originalName: string): string {
		return `${crypto.randomUUID()}.jpg`
	}

	/**
	 * Uploads an image to Supabase storage with validation and compression
	 * @param file The file to upload
	 * @param options Upload options including bucket, folder, etc.
	 * @returns Promise resolving to the public URL of the uploaded image
	 */
	static async uploadImage(
		file: File,
		options: UploadImageOptions = {}
	): Promise<string> {
		// Set default options
		const {
			bucket = "maps",
			folder = "maps-display-pictures",
			contentType = "image/jpeg",
			cacheControl = "3600",
			upsert = false,
			serverSupabase = null, // New parameter for server-side Supabase client
		} = options

		// Use provided server-side Supabase client or create a browser client
		const supabase =
			serverSupabase ||
			(await (async () => {
				const { createClient } = await import(
					"@/lib/supabase/api/supabaseClient"
				)
				return createClient()
			})())

		// Validate the image
		const validation = ImageProcessor.validateImage(file)
		if (!validation.isValid) throw new Error(validation.error)

		// Compress the image if in browser environment, otherwise use as is
		const compressedImage = await ImageProcessor.compressImage(file)
		if (compressedImage.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
			throw new Error("Image too large after compression. Try a smaller image.")
		}

		// Generate a unique filename
		const fileName = ImageProcessor.generateFileName(file.name)
		const filePath = `${folder}/${fileName}`

		// Upload to Supabase storage
		const { error: uploadError } = await supabase.storage
			.from(bucket)
			.upload(filePath, compressedImage, {
				contentType,
				cacheControl,
				upsert,
			})

		if (uploadError)
			throw new Error(`Failed to upload image: ${uploadError.message}`)

		// Get the public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from(bucket).getPublicUrl(filePath)

		return publicUrl
	}
}
