import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"
import { getUser } from "@/lib/auth/getUser"
import { LayoutClient } from "@/components/layout/LayoutClient"

// Optimize font loading with display: swap
const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
	display: "swap",
	preload: true,
})

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
	display: "swap",
	preload: false, // Only preload primary font
})

export const metadata: Metadata = {
	title: "Bengaluru Maps | Community-Driven Maps of Bengaluru",
	description:
		"Discover the best cafes, restaurants, and hangout spots in Bengaluru through community-curated maps. Find hidden gems, contribute your favorite places, and explore the city like a local.",
	keywords: [
		"Bengaluru",
		"Bangalore",
		"maps",
		"cafes",
		"restaurants",
		"community",
		"local spots",
		"city guide",
		"hangout spots",
		"coworking spaces",
	],
	authors: [
		{ name: "Sudarshan SK", url: "https://twitter.com/realsudarshansk" },
	],
	creator: "Sudarshan SK",
	publisher: "Bengaluru Maps",
	openGraph: {
		type: "website",
		locale: "en_IN",
		url: "https://www.bengalurumaps.com",
		title: "Bengaluru Maps | Community-Driven Maps",
		description:
			"Discover the best cafes, restaurants, and hangout spots in Bengaluru through community-curated maps.",
		siteName: "Bengaluru Maps",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Bengaluru Maps - Community-Driven Maps",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Bengaluru Maps | Community-Driven Maps",
		description:
			"Discover the best cafes, restaurants, and hangout spots in Bengaluru through community-curated maps.",
		creator: "@realsudarshansk",
		images: ["/og-image.jpg"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	metadataBase: new URL("https://www.bengalurumaps.com"),
	alternates: {
		canonical: "/",
	},
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	// Fetch user data on the server - no race conditions
	const user = await getUser()

	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full`}
		>
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover"
				/>
				<link rel="icon" href="/favicon.ico" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="192x192"
					href="/android-chrome-192x192.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="512x512"
					href="/android-chrome-512x512.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
				<meta name="msapplication-TileColor" content="#ffffff" />
				<meta name="theme-color" content="#ffffff" />

				{/* DNS prefetch and preconnect for Supabase */}
				{process.env.NEXT_PUBLIC_SUPABASE_URL && (
					<>
						<link
							rel="dns-prefetch"
							href={process.env.NEXT_PUBLIC_SUPABASE_URL}
						/>
						<link
							rel="preconnect"
							href={process.env.NEXT_PUBLIC_SUPABASE_URL}
						/>
					</>
				)}
			</head>
			<body className="font-sans antialiased h-full overflow-hidden">
				<LayoutClient user={user}>{children}</LayoutClient>
				<Analytics />
			</body>
		</html>
	)
}
