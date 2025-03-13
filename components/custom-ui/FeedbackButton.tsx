"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Mail, BugIcon, Lightbulb } from "lucide-react"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/lib/hooks/use-toast"
import { usePathname } from "next/navigation"

// X (formerly Twitter) logo as an SVG component
const XLogo = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"
			fill="currentColor"
		/>
	</svg>
)

export default function FeedbackButton() {
	const [feedback, setFeedback] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const { toast } = useToast()
	const pathname = usePathname()

	// Check if we're on a map page
	const isMapPage = pathname?.includes("/maps/") || false

	// Adjust position based on the page
	const buttonPositionClass = isMapPage
		? "bottom-20 md:bottom-6 right-6" // Higher position on map pages (especially on mobile)
		: "bottom-6 right-6" // Default position on other pages

	const handleEmailFeedback = () => {
		const subject = encodeURIComponent("Feedback for Bengaluru Townsquare")
		const body = encodeURIComponent(feedback)
		window.open(
			`mailto:sudarshan@bobscompany.co?subject=${subject}&body=${body}`,
			"_blank"
		)

		toast({
			title: "Email client opened",
			description: "Thank you for your feedback!",
			duration: 3000,
		})

		setFeedback("")
		setIsOpen(false)
	}

	const handleXFeedback = () => {
		window.open("https://twitter.com/realsudarshansk", "_blank")

		toast({
			title: "X (Twitter) opened",
			description: "Connect with @realsudarshansk for faster response",
			duration: 3000,
		})

		setFeedback("")
		setIsOpen(false)
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className={`fixed ${buttonPositionClass} h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50 transition-all duration-300`}
					aria-label="Send feedback"
				>
					<MessageSquare className="h-5 w-5" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4" side="top">
				<div className="space-y-4">
					<div className="space-y-2">
						<h3 className="font-medium text-lg">
							Report Issues or Suggestions
						</h3>
						<p className="text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<BugIcon className="h-3.5 w-3.5" /> Something not working?
							</span>
							<span className="flex items-center gap-1 mt-1">
								<Lightbulb className="h-3.5 w-3.5" /> Have ideas to improve the
								site?
							</span>
						</p>
					</div>

					<Textarea
						placeholder="Your feedback..."
						value={feedback}
						onChange={(e) => setFeedback(e.target.value)}
						className="min-h-[100px]"
					/>

					<div className="flex flex-col gap-2">
						<Button
							onClick={handleEmailFeedback}
							className="w-full flex items-center justify-center gap-2"
						>
							<Mail className="h-4 w-4" />
							<span>Send via Email</span>
						</Button>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-muted-foreground/20" />
							</div>
							<div className="relative flex justify-center text-xs">
								<span className="bg-popover px-2 text-muted-foreground">
									or
								</span>
							</div>
						</div>

						<Button
							variant="outline"
							onClick={handleXFeedback}
							className="w-full flex items-center justify-center gap-2"
						>
							<XLogo />
							<span>Connect on X (Faster Response)</span>
						</Button>
					</div>

					<p className="text-xs text-muted-foreground text-center">
						For faster response, reach out on X @realsudarshansk
					</p>
				</div>
			</PopoverContent>
		</Popover>
	)
}
