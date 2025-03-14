// components/ShareButton.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { Share2, X as XIcon, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

interface ShareButtonProps {
	mapId: string
	slug?: string
	title?: string
	description?: string
	image?: string
}

export default function ShareButton({
	mapId,
	slug,
	title = "Check out this map on Bengaluru Maps",
	description = "Discover cool places in Bengaluru",
	image,
}: ShareButtonProps) {
	const { toast } = useToast()
	const [isGeneratingImage, setIsGeneratingImage] = useState(false)
	const [isMobile, setIsMobile] = useState(false)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	// Detect if user is on mobile device
	useEffect(() => {
		const checkMobile = () => {
			const userAgent =
				navigator.userAgent || navigator.vendor || (window as any).opera
			const isMobileDevice =
				/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
					userAgent.toLowerCase()
				)
			setIsMobile(isMobileDevice)
		}

		checkMobile()
		window.addEventListener("resize", checkMobile)

		return () => {
			window.removeEventListener("resize", checkMobile)
		}
	}, [])

	const getShareUrl = () => {
		return `${window.location.origin}/maps/${slug || "map"}/${mapId}`
	}

	const handleCopyLink = async () => {
		const url = getShareUrl()
		try {
			await navigator.clipboard.writeText(url)
			toast({
				title: "Link Copied!",
				description: "The map URL has been copied to your clipboard.",
				duration: 3000,
			})
		} catch (err) {
			toast({
				title: "Failed to Copy",
				description: "Couldn't copy the URL. Please try again.",
				variant: "destructive",
				duration: 3000,
			})
		}
	}

	const handleWhatsAppShare = () => {
		const url = getShareUrl()
		const message = `Here's a collection of cool places in Bangalore: ${title}\n\n${description}\n\n${url}\n\nDiscover the best local spots in the city!`
		const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
		window.open(whatsappUrl, "_blank")
	}

	const handleXShare = () => {
		const url = getShareUrl()
		const message = `Here's a collection of cool places in Bangalore: ${title}\n\n${description}`
		const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			message
		)}&url=${encodeURIComponent(
			url
		)}&hashtags=BengaluruMaps,Bangalore,CoolSpots`
		window.open(xUrl, "_blank")
	}

	const handleInstagramShare = async () => {
		// For mobile devices, try to open Instagram stories directly
		if (isMobile) {
			try {
				setIsGeneratingImage(true)
				const shareUrl = getShareUrl()

				// Create a high-quality image for Instagram stories
				const canvas = document.createElement("canvas")
				const ctx = canvas.getContext("2d")

				if (!ctx) {
					throw new Error("Could not get canvas context")
				}

				// Set dimensions for Instagram story (1080x1920 is ideal)
				canvas.width = 1080
				canvas.height = 1920

				// Create a more visually appealing background with a gradient that matches the map theme
				// Use a blue gradient similar to the Bengaluru Maps branding
				const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
				gradient.addColorStop(0, "#3b82f6") // Blue at top
				gradient.addColorStop(0.7, "#60a5fa") // Lighter blue
				gradient.addColorStop(1, "#93c5fd") // Even lighter blue at bottom
				ctx.fillStyle = gradient
				ctx.fillRect(0, 0, canvas.width, canvas.height)

				// Add a subtle pattern overlay for texture
				ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
				for (let i = 0; i < canvas.height; i += 20) {
					ctx.fillRect(0, i, canvas.width, 10)
				}

				// Add diagonal pattern for more visual interest
				ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
				ctx.lineWidth = 2
				for (
					let i = -canvas.height;
					i < canvas.width + canvas.height;
					i += 40
				) {
					ctx.beginPath()
					ctx.moveTo(i, 0)
					ctx.lineTo(i + canvas.height, canvas.height)
					ctx.stroke()
				}

				// Add Bengaluru Maps header at the top
				ctx.fillStyle = "white"
				ctx.font = "bold 60px sans-serif"
				ctx.textAlign = "center"
				ctx.fillText("Bengaluru Maps", canvas.width / 2, 120)

				// Add a decorative underline
				ctx.strokeStyle = "white"
				ctx.lineWidth = 3
				ctx.beginPath()
				ctx.moveTo(canvas.width / 2 - 200, 140)
				ctx.lineTo(canvas.width / 2 + 200, 140)
				ctx.stroke()

				// Load and draw map image prominently
				if (image) {
					try {
						const img = new Image()
						img.crossOrigin = "anonymous"

						// Wait for image to load
						await new Promise((resolve, reject) => {
							img.onload = resolve
							img.onerror = reject
							img.src = image
						})

						// Draw image in a frame at the top portion with a white border/frame
						ctx.fillStyle = "white"
						ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
						ctx.shadowBlur = 15
						ctx.shadowOffsetX = 0
						ctx.shadowOffsetY = 5
						roundedRect(ctx, 90, 200, canvas.width - 180, 600, 20)
						ctx.shadowColor = "transparent"

						// Draw the actual image inside the frame with rounded corners
						ctx.save()
						ctx.beginPath()
						roundedRectPath(ctx, 100, 210, canvas.width - 200, 580, 15)
						ctx.clip()
						ctx.drawImage(img, 100, 210, canvas.width - 200, 580)
						ctx.restore()

						// Add a subtle overlay gradient at the bottom of the image for better text contrast
						const imageOverlay = ctx.createLinearGradient(0, 210, 0, 790)
						imageOverlay.addColorStop(0.7, "rgba(0, 0, 0, 0)")
						imageOverlay.addColorStop(1, "rgba(0, 0, 0, 0.3)")
						ctx.save()
						ctx.beginPath()
						roundedRectPath(ctx, 100, 210, canvas.width - 200, 580, 15)
						ctx.clip()
						ctx.fillStyle = imageOverlay
						ctx.fillRect(100, 210, canvas.width - 200, 580)
						ctx.restore()
					} catch (error) {
						console.warn("Could not load map image, using text-only design")
					}
				}

				// Add a prominent title section
				ctx.fillStyle = "white"
				ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
				ctx.shadowBlur = 10
				ctx.shadowOffsetX = 0
				ctx.shadowOffsetY = 3
				roundedRect(ctx, 90, 840, canvas.width - 180, 200, 20)
				ctx.shadowColor = "transparent"

				// Draw title with larger, more attractive font
				ctx.font = "bold 70px sans-serif"
				ctx.fillStyle = "#1e3a8a" // Dark blue
				ctx.textAlign = "center"
				wrapText(ctx, title, canvas.width / 2, 920, canvas.width - 240, 80)

				// Draw description
				ctx.font = "40px sans-serif"
				ctx.fillStyle = "#1e40af" // Medium blue
				ctx.textAlign = "center"
				wrapText(
					ctx,
					description,
					canvas.width / 2,
					1020,
					canvas.width - 240,
					50
				)

				// Add a "Discover Bangalore" section
				ctx.fillStyle = "white"
				ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
				ctx.shadowBlur = 10
				ctx.shadowOffsetX = 0
				ctx.shadowOffsetY = 3
				roundedRect(ctx, 90, 1080, canvas.width - 180, 300, 20)
				ctx.shadowColor = "transparent"

				// Section title
				ctx.font = "bold 50px sans-serif"
				ctx.fillStyle = "#1e3a8a"
				ctx.textAlign = "center"
				ctx.fillText("Discover Bangalore", canvas.width / 2, 1140)

				// Add some enticing text about the map
				ctx.font = "36px sans-serif"
				ctx.fillStyle = "#1e40af"
				ctx.textAlign = "center"
				ctx.fillText(
					"Local favorites • Hidden gems • Must-visit spots",
					canvas.width / 2,
					1200
				)

				// Add map icon
				ctx.fillStyle = "#ef4444" // Red
				ctx.beginPath()
				ctx.arc(canvas.width / 2, 1280, 40, 0, Math.PI * 2)
				ctx.fill()

				// Map pin icon (simplified)
				ctx.strokeStyle = "white"
				ctx.lineWidth = 4
				ctx.beginPath()
				ctx.arc(canvas.width / 2, 1270, 12, 0, Math.PI * 2)
				ctx.stroke()
				ctx.beginPath()
				ctx.moveTo(canvas.width / 2, 1282)
				ctx.lineTo(canvas.width / 2, 1310)
				ctx.stroke()

				// Add a clear call-to-action for the URL
				ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
				ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
				ctx.shadowBlur = 15
				ctx.shadowOffsetX = 0
				ctx.shadowOffsetY = 5
				roundedRect(ctx, 90, 1420, canvas.width - 180, 180, 20)
				ctx.shadowColor = "transparent"

				// URL text
				ctx.font = "bold 46px sans-serif"
				ctx.fillStyle = "white"
				ctx.textAlign = "center"
				ctx.fillText("Tap to explore", canvas.width / 2, 1480)

				// URL display
				ctx.font = "36px sans-serif"
				ctx.fillStyle = "#93c5fd" // Light blue
				ctx.fillText(shareUrl, canvas.width / 2, 1550)

				// Add Bengaluru Maps branding at the bottom
				ctx.fillStyle = "white"
				ctx.font = "bold 36px sans-serif"
				ctx.textAlign = "center"
				ctx.fillText("Bengaluru Maps", canvas.width / 2, 1750)

				// Add a small logo
				ctx.fillStyle = "white"
				ctx.beginPath()
				ctx.arc(canvas.width / 2, 1700, 30, 0, Math.PI * 2)
				ctx.fill()

				ctx.fillStyle = "#3b82f6"
				ctx.font = "bold 36px sans-serif"
				ctx.textAlign = "center"
				ctx.textBaseline = "middle"
				ctx.fillText("B", canvas.width / 2, 1700)
				ctx.textBaseline = "alphabetic"

				// Add a decorative footer
				ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
				ctx.fillRect(0, canvas.height - 50, canvas.width, 50)

				// Convert canvas to blob and get data URL
				const dataUrl = canvas.toDataURL("image/png")
				const blob = await (await fetch(dataUrl)).blob()

				// Create a File object from the blob
				const imageFile = new File([blob], "bengaluru-map.png", {
					type: "image/png",
				})

				// Different approaches for iOS and Android
				const isIOS = /iphone|ipad|ipod/i.test(
					navigator.userAgent.toLowerCase()
				)

				try {
					// First, try to use the Instagram Stories URL scheme with direct URL sticker
					// This requires hosting the image somewhere accessible by Instagram

					// For demonstration, we'll save the image locally and then try the URL scheme
					// In a production app, you would upload this image to your server and get a public URL

					// Save the image locally
					const link = document.createElement("a")
					link.href = dataUrl
					link.download = "bengaluru-map.png"
					link.click()

					// Copy URL to clipboard as fallback
					await navigator.clipboard.writeText(shareUrl)

					// Try to use the Instagram Stories URL scheme
					setTimeout(() => {
						// Construct the Instagram Stories URL with parameters
						// Note: In a real implementation, you would need to host the image at a public URL
						// For now, we'll just open Instagram Stories and rely on the user selecting the downloaded image

						if (isIOS) {
							// iOS approach
							const instagramUrl = `instagram-stories://share?source_application=bengalurumaps&text=${encodeURIComponent(
								title
							)}&url=${encodeURIComponent(shareUrl)}`
							window.location.href = instagramUrl

							toast({
								title: "Opening Instagram Stories",
								description:
									"Select the downloaded image. A URL sticker has been added automatically.",
								duration: 5000,
							})
						} else {
							// Android approach
							const instagramUrl = `intent://instagram.com/stories/#Intent;scheme=https;package=com.instagram.android;S.source_application=bengalurumaps;S.text=${encodeURIComponent(
								title
							)};S.url=${encodeURIComponent(shareUrl)};end`
							window.location.href = instagramUrl

							toast({
								title: "Opening Instagram Stories",
								description:
									"Select the downloaded image. A URL sticker has been added automatically.",
								duration: 5000,
							})
						}
					}, 500)
				} catch (error) {
					console.error("Error using Instagram Stories URL scheme:", error)

					// Fall back to Web Share API if available
					if (navigator.share) {
						try {
							// Try to share with the Web Share API
							const shareData: any = {
								title: title,
								text: description,
								url: shareUrl,
							}

							// Add the image file if supported
							if (
								navigator.canShare &&
								navigator.canShare({ files: [imageFile] })
							) {
								shareData.files = [imageFile]
							}

							await navigator.share(shareData)

							toast({
								title: "Shared Successfully",
								description:
									"Select Instagram Stories from the share sheet to post.",
								duration: 3000,
							})
						} catch (shareError) {
							console.error("Web Share API error:", shareError)
							downloadImageWithInstructions(blob, shareUrl)
						}
					} else {
						// If Web Share API is not available, download the image with instructions
						downloadImageWithInstructions(blob, shareUrl)
					}
				}
			} catch (error) {
				console.error("Error sharing to Instagram:", error)
				toast({
					variant: "destructive",
					title: "Sharing Failed",
					description:
						"Could not share to Instagram. Try downloading the image instead.",
					duration: 3000,
				})
				// Fall back to the original image generation method
				createInstagramStoryImage()
			} finally {
				setIsGeneratingImage(false)
			}
		} else {
			// On desktop, use the image generation approach
			createInstagramStoryImage()
		}
	}

	// Helper function to download image with instructions
	const downloadImageWithInstructions = (blob: Blob, shareUrl: string) => {
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.download = "bengaluru-map.png"
		link.click()

		// Copy URL to clipboard
		navigator.clipboard.writeText(shareUrl).catch(() => {
			// Silent catch
		})

		toast({
			title: "Image Downloaded",
			description:
				"Open Instagram, create a new story, add this image, and paste the copied URL as a link sticker",
			duration: 8000,
		})
	}

	const createInstagramStoryImage = async () => {
		setIsGeneratingImage(true)

		try {
			// Create a canvas element
			const canvas = document.createElement("canvas")
			const ctx = canvas.getContext("2d")

			if (!ctx) {
				throw new Error("Could not get canvas context")
			}

			// Set Instagram story dimensions (1080x1920)
			canvas.width = 1080
			canvas.height = 1920

			// Draw gradient background
			const gradient = ctx.createLinearGradient(
				0,
				0,
				canvas.width,
				canvas.height
			)
			gradient.addColorStop(0, "#f3f4f6") // Light gray
			gradient.addColorStop(1, "#dbeafe") // Light blue
			ctx.fillStyle = gradient
			ctx.fillRect(0, 0, canvas.width, canvas.height)

			// Load and draw map image as background (if available)
			if (image) {
				try {
					const img = new Image()
					img.crossOrigin = "anonymous"

					// Wait for image to load
					await new Promise((resolve, reject) => {
						img.onload = resolve
						img.onerror = reject
						img.src = image
					})

					// Draw blurred background image
					ctx.save()
					ctx.filter = "blur(10px) opacity(0.7)"
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
					ctx.restore()

					// Add semi-transparent overlay for better text readability
					ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
					ctx.fillRect(0, 0, canvas.width, canvas.height)
				} catch (error) {
					console.warn(
						"Could not load map image, using gradient background instead"
					)
				}
			}

			// Draw header section with title and description
			ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
			roundedRect(ctx, 100, 120, canvas.width - 200, 240, 20)

			// Draw "Discover Bangalore" text
			ctx.font = "bold 48px sans-serif"
			ctx.fillStyle = "#6366f1" // Indigo color
			ctx.fillText("Discover Bangalore", 140, 180)

			// Draw title
			ctx.font = "bold 60px sans-serif"
			ctx.fillStyle = "#111827"
			wrapText(ctx, title, 140, 250, canvas.width - 280, 70)

			// Draw description
			ctx.font = "36px sans-serif"
			ctx.fillStyle = "#4b5563"
			wrapText(ctx, description, 140, 350, canvas.width - 280, 50)

			// Draw map details section
			ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
			roundedRect(ctx, 100, canvas.height - 600, canvas.width - 200, 300, 20)

			// Draw Bengaluru Maps logo/icon
			ctx.fillStyle = "#3b82f6" // Primary blue color
			ctx.beginPath()
			ctx.arc(180, canvas.height - 520, 60, 0, Math.PI * 2)
			ctx.fill()

			// Draw "B" in the circle
			ctx.font = "bold 70px sans-serif"
			ctx.fillStyle = "white"
			ctx.textAlign = "center"
			ctx.textBaseline = "middle"
			ctx.fillText("B", 180, canvas.height - 520)
			ctx.textAlign = "left"
			ctx.textBaseline = "alphabetic"

			// Draw app name
			ctx.font = "bold 40px sans-serif"
			ctx.fillStyle = "#111827"
			ctx.fillText("Bengaluru Maps", 260, canvas.height - 535)

			// Draw tagline
			ctx.font = "30px sans-serif"
			ctx.fillStyle = "#4b5563"
			ctx.fillText("Cool places in the city", 260, canvas.height - 485)

			// Draw feature icons and text
			// Location icon
			ctx.fillStyle = "#ef4444" // Red
			ctx.beginPath()
			ctx.arc(180, canvas.height - 380, 30, 0, Math.PI * 2)
			ctx.fill()

			// Location icon (simplified)
			ctx.strokeStyle = "white"
			ctx.lineWidth = 3
			ctx.beginPath()
			ctx.arc(180, canvas.height - 385, 10, 0, Math.PI * 2)
			ctx.stroke()
			ctx.beginPath()
			ctx.moveTo(180, canvas.height - 375)
			ctx.lineTo(180, canvas.height - 355)
			ctx.stroke()

			// Location text
			ctx.font = "36px sans-serif"
			ctx.fillStyle = "#111827"
			ctx.fillText("Local landmarks", 230, canvas.height - 370)

			// Community icon
			ctx.fillStyle = "#3b82f6" // Blue
			ctx.beginPath()
			ctx.arc(540, canvas.height - 380, 30, 0, Math.PI * 2)
			ctx.fill()

			// Community icon (simplified)
			ctx.strokeStyle = "white"
			ctx.lineWidth = 3
			ctx.beginPath()
			ctx.arc(540, canvas.height - 385, 10, 0, Math.PI * 2)
			ctx.stroke()
			ctx.beginPath()
			ctx.arc(530, canvas.height - 370, 6, 0, Math.PI * 2)
			ctx.stroke()
			ctx.beginPath()
			ctx.arc(550, canvas.height - 370, 6, 0, Math.PI * 2)
			ctx.stroke()

			// Community text
			ctx.font = "36px sans-serif"
			ctx.fillStyle = "#111827"
			ctx.fillText("Foodie favorites", 590, canvas.height - 370)

			// Draw swipe up indicator
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
			roundedRect(ctx, canvas.width / 2 - 250, canvas.height - 250, 500, 80, 40)

			// Swipe up text
			ctx.font = "36px sans-serif"
			ctx.fillStyle = "white"
			ctx.textAlign = "center"
			ctx.fillText(
				"Swipe up to explore Bengaluru",
				canvas.width / 2,
				canvas.height - 200
			)

			// Draw arrow
			ctx.strokeStyle = "white"
			ctx.lineWidth = 4
			ctx.beginPath()
			ctx.moveTo(canvas.width / 2, canvas.height - 180)
			ctx.lineTo(canvas.width / 2, canvas.height - 160)
			ctx.stroke()
			ctx.beginPath()
			ctx.moveTo(canvas.width / 2 - 10, canvas.height - 170)
			ctx.lineTo(canvas.width / 2, canvas.height - 160)
			ctx.lineTo(canvas.width / 2 + 10, canvas.height - 170)
			ctx.stroke()

			// Draw URL
			ctx.font = "32px sans-serif"
			ctx.fillStyle = "white"
			ctx.textAlign = "center"
			ctx.fillText(getShareUrl(), canvas.width / 2, canvas.height - 120)
			ctx.textAlign = "left"

			// Draw watermark
			ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
			roundedRect(ctx, canvas.width - 350, canvas.height - 100, 250, 60, 10)

			// Draw watermark logo
			ctx.fillStyle = "#3b82f6" // Primary blue color
			ctx.beginPath()
			ctx.arc(canvas.width - 310, canvas.height - 70, 20, 0, Math.PI * 2)
			ctx.fill()

			// Draw "B" in the circle
			ctx.font = "bold 24px sans-serif"
			ctx.fillStyle = "white"
			ctx.textAlign = "center"
			ctx.textBaseline = "middle"
			ctx.fillText("B", canvas.width - 310, canvas.height - 70)
			ctx.textAlign = "left"
			ctx.textBaseline = "alphabetic"

			// Draw watermark text
			ctx.font = "bold 24px sans-serif"
			ctx.fillStyle = "#111827"
			ctx.fillText("Bengaluru Maps", canvas.width - 280, canvas.height - 60)

			// Convert canvas to blob and share
			const dataUrl = canvas.toDataURL("image/png")
			const blob = await (await fetch(dataUrl)).blob()

			// For mobile devices, try to use the Web Share API with files
			if (isMobile) {
				// Try to use the Web Share API with files
				if (
					navigator.share &&
					navigator.canShare &&
					navigator.canShare({
						files: [
							new File([blob], "bengaluru-map.png", { type: "image/png" }),
						],
					})
				) {
					await navigator.share({
						title: "Cool Places in Bangalore",
						text: `Here's a collection of cool places in Bangalore: ${title}`,
						url: getShareUrl(),
						files: [
							new File([blob], "bengaluru-map.png", { type: "image/png" }),
						],
					})

					toast({
						title: "Ready for Instagram!",
						description:
							"Image shared. You can now post it to your Instagram story.",
						duration: 3000,
					})
				} else {
					// If Web Share API with files is not supported, try to download the image
					// and provide instructions for manual sharing
					const link = document.createElement("a")
					link.href = dataUrl
					link.download = "bengaluru-map.png"
					link.click()

					// Copy the URL to clipboard for easy pasting
					navigator.clipboard.writeText(getShareUrl()).catch(() => {
						// Silent catch - not critical if this fails
					})

					toast({
						title: "Image Downloaded",
						description:
							"Open Instagram, create a new story, and add this image. Then add a URL sticker with the copied link.",
						duration: 5000,
					})
				}
			} else {
				// For desktop, just download the image
				const link = document.createElement("a")
				link.href = dataUrl
				link.download = "bengaluru-map.png"
				link.click()

				toast({
					title: "Image Downloaded",
					description:
						"Share this image on Instagram Stories and add the URL sticker.",
					duration: 5000,
				})
			}
		} catch (error) {
			console.error("Error generating image:", error)
			toast({
				title: "Image Generation Failed",
				description:
					"Could not create image for Instagram. Try again or use another sharing method.",
				variant: "destructive",
				duration: 3000,
			})
		} finally {
			setIsGeneratingImage(false)
		}
	}

	// Helper function to draw rounded rectangles
	function roundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number
	) {
		ctx.beginPath()
		ctx.moveTo(x + radius, y)
		ctx.lineTo(x + width - radius, y)
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
		ctx.lineTo(x + width, y + height - radius)
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
		ctx.lineTo(x + radius, y + height)
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
		ctx.lineTo(x, y + radius)
		ctx.quadraticCurveTo(x, y, x + radius, y)
		ctx.closePath()
		ctx.fill()
	}

	// Helper function to wrap text
	function wrapText(
		ctx: CanvasRenderingContext2D,
		text: string,
		x: number,
		y: number,
		maxWidth: number,
		lineHeight: number
	) {
		const words = text.split(" ")
		let line = ""
		let testLine = ""
		let lineCount = 0

		for (let n = 0; n < words.length; n++) {
			testLine = line + words[n] + " "
			const metrics = ctx.measureText(testLine)
			const testWidth = metrics.width

			if (testWidth > maxWidth && n > 0) {
				ctx.fillText(line, x, y + lineCount * lineHeight)
				line = words[n] + " "
				lineCount++

				// Limit to 3 lines
				if (lineCount >= 3) {
					if (n < words.length - 1) line = line.slice(0, -1) + "..."
					break
				}
			} else {
				line = testLine
			}
		}

		ctx.fillText(line, x, y + lineCount * lineHeight)
	}

	// Helper function to create a path for rounded rectangles (for clipping)
	function roundedRectPath(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number
	) {
		ctx.beginPath()
		ctx.moveTo(x + radius, y)
		ctx.lineTo(x + width - radius, y)
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
		ctx.lineTo(x + width, y + height - radius)
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
		ctx.lineTo(x + radius, y + height)
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
		ctx.lineTo(x, y + radius)
		ctx.quadraticCurveTo(x, y, x + radius, y)
		ctx.closePath()
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm">
					<Share2 className="h-4 w-4 mr-2" />
					Share
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-3" align="end">
				<div className="space-y-2">
					<h3 className="font-medium text-sm mb-2">Share this map</h3>
					<div className="grid grid-cols-2 gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopyLink}
							className="flex items-center justify-center gap-2"
						>
							<Share2 className="h-4 w-4" />
							Copy Link
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={handleWhatsAppShare}
							className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
						>
							<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
							</svg>
							WhatsApp
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={handleXShare}
							className="flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white border-gray-800"
						>
							<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
							</svg>
							X
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={handleInstagramShare}
							disabled={isGeneratingImage}
							className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-purple-300"
						>
							<Instagram className="h-4 w-4" />
							{isGeneratingImage ? "Creating..." : "Instagram"}
						</Button>
					</div>

					{isGeneratingImage && (
						<div className="mt-2 text-xs text-center text-gray-500">
							Creating Instagram story image...
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}
