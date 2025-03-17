import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "../components/custom-ui/Header"
import { AuthProvider } from "@/lib/context/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { PendingCountProvider } from "@/lib/context/PendingCountContext"
import FeedbackButton from "@/components/custom-ui/FeedbackButton"
import { RouteTransition } from "@/components/custom-ui/RouteTransition"

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
				url: "/images/og-image.jpg",
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
		images: ["/images/og-image.jpg"],
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full`}
		>
			<head>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
				/>
				<link rel="icon" href="/favicon.ico" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/images/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/images/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/images/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<link
					rel="mask-icon"
					href="/images/safari-pinned-tab.svg"
					color="#000000"
				/>
				<meta name="msapplication-TileColor" content="#ffffff" />
				<meta name="theme-color" content="#ffffff" />

				{/* Preload critical assets */}
				<link rel="preload" href="/placeholder.svg" as="image" />
				<link
					rel="dns-prefetch"
					href="https://omnlyrfivyoazohpwdzu.supabase.co"
				/>
				<link
					rel="preconnect"
					href="https://omnlyrfivyoazohpwdzu.supabase.co"
				/>
			</head>
			<body className="font-sans antialiased">
				<AuthProvider>
					<PendingCountProvider>
						<RouteTransition />
						{/* Create a flex layout with header and main content */}
						<div className="flex flex-col min-h-screen">
							<Header />
							<main className="flex-1">{children}</main>
						</div>
						{/* <FeedbackButton /> */}
					</PendingCountProvider>
				</AuthProvider>
				<Toaster />
			</body>
		</html>
	)
}
