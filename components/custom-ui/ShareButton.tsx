// components/ShareButton.tsx
"use client"

import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"

interface ShareButtonProps {
	mapId: string
	slug?: string
}

export default function ShareButton({ mapId, slug }: ShareButtonProps) {
	const { toast } = useToast()

	const handleShare = async () => {
		const url = `${window.location.origin}/maps/${slug || "map"}/${mapId}`
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

	return (
		<Button variant="outline" size="sm" onClick={handleShare}>
			<Share2 className="h-4 w-4 mr-2" />
			Share
		</Button>
	)
}
