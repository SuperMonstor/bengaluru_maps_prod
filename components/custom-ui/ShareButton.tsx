"use client"

import { useState, useEffect } from "react"
import { Share2, Instagram } from "lucide-react"
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
  creator?: string
  likes?: number
  locations?: number
  contributors?: number
}

export default function ShareButton({
  mapId,
  slug,
  title = "Check out this map on Bengaluru Maps",
  description = "Discover cool places in Bengaluru",
  image,
  creator = "Bengaluru Maps User",
  likes = 0,
  locations = 0,
  contributors = 0,
}: ShareButtonProps) {
  const { toast } = useToast()
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect if user is on a mobile device
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
    setIsGeneratingImage(true)

    try {
      const shareUrl = getShareUrl()

      // Create a canvas for Instagram Story (1080x1920)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      canvas.width = 1080
      canvas.height = 1920

      // Background: White
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Header: "Bengaluru Maps" with "By [creator]"
      ctx.font = "bold 36px sans-serif"
      ctx.fillStyle = "#000000"
      ctx.textAlign = "left"
      ctx.fillText("Bengaluru Maps", 40, 80)

      ctx.font = "20px sans-serif"
      ctx.fillStyle = "#6B7280" // Gray
      ctx.fillText(`By ${creator}`, 40 + ctx.measureText("Bengaluru Maps").width + 10, 80)

      // Title
      ctx.font = "bold 80px sans-serif"
      ctx.fillStyle = "#000000"
      ctx.textAlign = "left"
      wrapText(ctx, title, 40, 160, canvas.width - 80, 90)

      // Description
      ctx.font = "24px sans-serif"
      ctx.fillStyle = "#6B7280"
      wrapText(ctx, description, 40, 380, canvas.width - 80, 30)

      // Creator Info
      ctx.fillStyle = "#E5E7EB" // Light gray avatar placeholder
      ctx.beginPath()
      ctx.arc(40, 460, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = "20px sans-serif"
      ctx.fillStyle = "#6B7280"
      ctx.fillText(`Started by ${creator}`, 80, 465)

      // Likes, Locations, Contributors
      let xOffset = 80
      // Likes
      ctx.fillStyle = "#34D399" // Green
      ctx.beginPath()
      ctx.arc(xOffset + 100, 490, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.moveTo(xOffset + 92, 492)
      ctx.lineTo(xOffset + 98, 486)
      ctx.lineTo(xOffset + 104, 492)
      ctx.lineTo(xOffset + 102, 498)
      ctx.lineTo(xOffset + 96, 494)
      ctx.fill()
      ctx.font = "20px sans-serif"
      ctx.fillStyle = "#6B7280"
      ctx.fillText(`${likes}`, xOffset + 120, 495)
      xOffset += 70

      // Locations
      ctx.fillStyle = "#6B7280"
      ctx.beginPath()
      ctx.arc(xOffset + 100, 490, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.arc(xOffset + 100, 486, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.moveTo(xOffset + 100, 491)
      ctx.lineTo(xOffset + 100, 498)
      ctx.lineWidth = 2
      ctx.strokeStyle = "#FFFFFF"
      ctx.stroke()
      ctx.fillStyle = "#6B7280"
      ctx.fillText(`${locations} locations`, xOffset + 120, 495)
      xOffset += 120

      // Contributors
      ctx.fillStyle = "#6B7280"
      ctx.beginPath()
      ctx.arc(xOffset + 100, 490, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.arc(xOffset + 96, 486, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.arc(xOffset + 104, 486, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.arc(xOffset + 100, 494, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#6B7280"
      ctx.fillText(`${contributors} contributors`, xOffset + 120, 495)

      // Map Image (16:9 aspect ratio, 1000x562.5)
      if (image) {
        try {
          const img = new Image()
          img.crossOrigin = "anonymous"
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = image
          })
          ctx.strokeStyle = "#E5E7EB"
          ctx.lineWidth = 2
          roundedRectPath(ctx, 40, 560, 1000, 562.5, 10)
          ctx.stroke()
          ctx.save()
          ctx.beginPath()
          roundedRectPath(ctx, 40, 560, 1000, 562.5, 10)
          ctx.clip()
          ctx.drawImage(img, 40, 560, 1000, 562.5)
          ctx.restore()
        } catch (error) {
          console.warn("Could not load map image, skipping image section")
        }
      }

      // URL Section
      const urlYPosition = image ? 1200 : 700
      ctx.fillStyle = "#000000"
      ctx.font = "bold 40px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Tap to explore:", canvas.width / 2, urlYPosition)
      ctx.font = "32px sans-serif"
      ctx.fillStyle = "#3B82F6" // Blue
      wrapText(ctx, shareUrl, canvas.width / 2, urlYPosition + 50, canvas.width - 80, 40)

      // Convert canvas to blob
      const dataUrl = canvas.toDataURL("image/png")
      const blob = await (await fetch(dataUrl)).blob()
      const imageFile = new File([blob], "bengaluru-map.png", { type: "image/png" })

      // Copy URL to clipboard
      await navigator.clipboard.writeText(shareUrl)

      // Handle sharing based on device
      if (isMobile) {
        const base64Image = dataUrl.split(",")[1]
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())

        if (isIOS) {
          const instagramUrl = `instagram-stories://share?source_application=bengalurumaps`
          setTimeout(() => {
            window.location.href = instagramUrl
          }, 500)

          if (navigator.share && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
              files: [imageFile],
              title: title,
              text: description,
            })
          } else {
            downloadImage(blob)
          }
        } else {
          const instagramUrl = `intent://instagram.com/stories/#Intent;scheme=https;package=com.instagram.android;S.source_application=bengalurumaps;end`
          setTimeout(() => {
            window.location.href = instagramUrl
          }, 500)

          if (navigator.share && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
              files: [imageFile],
              title: title,
              text: description,
            })
          } else {
            downloadImage(blob)
          }
        }

        toast({
          title: "Opening Instagram Stories",
          description: "URL copied to clipboard. Paste it into a URL sticker!",
          duration: 5000,
        })
      } else {
        downloadImage(blob)
        toast({
          title: "Image Downloaded",
          description: "Upload to Instagram Stories and paste the copied URL into a sticker.",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error sharing to Instagram:", error)
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Could not share to Instagram. Try downloading the image instead.",
        duration: 3000,
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Helper function to download the image
  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bengaluru-map.png"
    link.click()
    URL.revokeObjectURL(url)
  }

  // Helper function to draw rounded rectangles
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
      } else {
        line = testLine
      }
    }

    ctx.fillText(line, x, y + lineCount * lineHeight)
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