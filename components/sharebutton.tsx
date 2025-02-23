"use client"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface ShareButtonProps {
	url: string
}

export default function ShareButton({ url }: ShareButtonProps) {
	const { toast } = useToast()

	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(url)
			toast({
				title: "Link Copied",
				description: "The map link has been copied to your clipboard.",
				duration: 2000,
			})
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to copy the link. Please try again.",
				variant: "destructive",
				duration: 2000,
			})
		}
	}

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={handleShare}
			className="hidden md:inline-flex" // Hidden on mobile to match screenshot
		>
			<Copy className="h-4 w-4" />
		</Button>
	)
}
