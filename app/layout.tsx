import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "./components/Header"

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
})

export const metadata: Metadata = {
	title: "Bengaluru Maps",
	description: "A community-driven project to find cool places in the city.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
			<body className="font-sans antialiased">
				<Header isSignedIn={false} userName="Sudarshan S" />
				{children}
			</body>
		</html>
	)
}
