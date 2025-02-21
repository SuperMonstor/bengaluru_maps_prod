import { CafeCard } from "@/components/cafecard"

export default function Home() {
	return (
		<main className="min-h-screen bg-gray-50/50">
			<div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
				<div className="text-center mb-12">
					<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
						A community-driven project to aggregate
						<span className="text-primary"> cool places in Bengaluru</span>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Discover and share the best spots in Bangalore - from cafes and
						restaurants to entertainment venues.
					</p>
				</div>

				<div className="grid gap-6 max-w-5xl mx-auto">
					<CafeCard
						title="Cafes with Wi-fi near me"
						description="A list of great public places with wi-fi to work"
						image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-39F4n2pgBGV7ES7BHKRbmBoje0XxTY.jpeg"
						locations={129}
						contributors={2}
						upvotes={28}
						username="@sudarshansk"
					/>

					<CafeCard
						title="Pool Tables Near Me"
						description="Bars with free pool tables"
						image="/placeholder.svg"
						locations={129}
						contributors={2}
						upvotes={28}
						username="@sudarshansk"
					/>

					<CafeCard
						title="Best Chinese Food Bangalore"
						description="Authentic Chinese restaurants in Bangalore"
						image="/placeholder.svg"
						locations={129}
						contributors={8}
						upvotes={28}
						username="@sudarshansk"
					/>
				</div>
			</div>
		</main>
	)
}
