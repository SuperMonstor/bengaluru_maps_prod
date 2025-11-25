import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

export default function NotFound() {
	return (
		<div className="bg-gray-50/50 flex flex-col items-center justify-center min-h-screen">
			<div className="container mx-auto px-4 py-16 text-center">
				<MapPin className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
				<h1 className="text-4xl font-bold mb-4">Map Not Found</h1>
				<p className="text-lg text-muted-foreground mb-8">
					The map you're looking for doesn't exist or has been removed.
				</p>
				<div className="flex gap-4 justify-center">
					<Link href="/">
						<Button variant="default">Browse Maps</Button>
					</Link>
					<Link href="/create-map">
						<Button variant="outline">Create a Map</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}
