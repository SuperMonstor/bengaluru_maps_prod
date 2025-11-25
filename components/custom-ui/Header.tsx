"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { memo, useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/components/layout/LayoutClient"
import { signOutAction } from "@/lib/actions/auth"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"
import { usePendingCount } from "@/lib/context/PendingCountContext"
import { HeartHandshake, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

// Add URLs for Google Maps feedback
const REQUEST_FEEDBACK_URL = "https://tally.so/r/nG5Mrk"

// SVG icons as memoized components to prevent re-renders
const ExternalLinkIcon = memo(() => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		className="w-3 h-3 inline-block"
		aria-hidden="true"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
		/>
	</svg>
))

const MapIcon = memo(() => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		className="w-4 h-4"
		aria-hidden="true"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
		/>
	</svg>
))

const PlusIcon = memo(() => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		className="w-4 h-4"
		aria-hidden="true"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			d="M12 4v16m8-8H4"
		/>
	</svg>
))

// Memoize the Header component to prevent unnecessary re-renders
const Header = memo(function Header() {
	const { user } = useUser()
	const { pendingCount } = usePendingCount()
	const router = useRouter()
	const [mounted, setMounted] = useState(false)

	// Prevent hydration mismatch by only rendering interactive components after mount
	useEffect(() => {
		setMounted(true)
	}, [])

	const handleSignOut = async () => {
		await signOutAction()
		// Trigger router refresh to re-fetch server data
		router.refresh()
	}

	// Debug: Log user picture_url
	useEffect(() => {
		if (user?.picture_url) {
			console.log('[Header] User picture_url:', user.picture_url)
		}
	}, [user])

	return (
		<header className="flex items-center justify-between p-3 md:p-4 w-full bg-white">
			{/* Left Section: Title and Byline */}
			<div className="flex flex-col min-w-0">
				<Link href="/" className="inline-block">
					<span className="text-lg sm:text-xl md:text-2xl font-semibold hover:opacity-80">
						Bengaluru Maps
					</span>
				</Link>
				<Link
					href="https://x.com/realsudarshansk"
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1 mt-1"
				>
					<span>By Sudarshan S</span>
					<ExternalLinkIcon />
				</Link>
			</div>

			{/* Right Section: Buttons and User Menu */}
			<div className="flex items-center gap-2 md:gap-3">
				{/* Mobile Menu - Only render after mount to prevent hydration mismatch */}
				{mounted && (
					<Sheet>
						<SheetTrigger asChild className="md:hidden">
							<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[300px] sm:w-[400px]">
							<div className="flex flex-col gap-6 mt-8">
								<Link
									href="/create-map"
									className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-gray-100"
								>
									<PlusIcon />
									<span>Create Map</span>
								</Link>

								<Link
									href={REQUEST_FEEDBACK_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-gray-100"
								>
									<HeartHandshake className="h-5 w-5" />
									<span>Request Feature/Fix</span>
								</Link>
							</div>
						</SheetContent>
					</Sheet>
				)}

				{/* Desktop Navigation */}
				<div className="hidden md:flex items-center gap-3">
					<Link
						href={REQUEST_FEEDBACK_URL}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button
							variant="outline"
							size="sm"
							className="border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2"
						>
							<HeartHandshake className="h-4 w-4" />
							Request Feature/Fix
						</Button>
					</Link>
				</div>

				{/* Create Map Button and User Menu */}
				<div className="flex items-center gap-2">
					{/* Create Map Button - Hidden on mobile */}
					<div className="hidden md:block">
						<Link href="/create-map">
							<Button
								variant="default"
								size="sm"
								className="flex items-center gap-2"
							>
								<PlusIcon />
								Create Map
							</Button>
						</Link>
					</div>

					{/* User Menu - Only render after mount to prevent hydration mismatch */}
					{!mounted ? (
						<div className="h-8 w-8 md:h-9 md:w-9 animate-pulse bg-gray-300 rounded-full" />
					) : user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-8 w-8 md:h-9 md:w-9 rounded-full p-0 border-2 border-transparent hover:border-primary/20 transition-colors"
								>
									<Avatar className="h-full w-full">
										<AvatarImage
											src={user?.picture_url || undefined}
											alt={`${user?.first_name} ${user?.last_name}`}
											onError={() => console.log('[Header] Avatar image failed to load')}
										/>
										<AvatarFallback>
											{user?.email?.[0]?.toUpperCase() ?? "U"}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								sideOffset={8}
								className="w-[calc(100vw-2rem)] max-w-[320px] p-0 bg-white shadow-lg rounded-lg border border-gray-100"
							>
								<div className="p-3 border-b border-gray-100">
									<div className="flex flex-col">
										<span className="font-semibold text-gray-900">
											{user?.first_name} {user?.last_name}
										</span>
										<span className="text-xs text-gray-500 truncate max-w-[180px]">
											{user?.email}
										</span>
									</div>
								</div>

								<div className="py-1">
									<Link href="/my-maps">
										<DropdownMenuItem className="flex items-center gap-2 cursor-pointer px-3 py-2">
											<MapIcon />
											<span>My Maps</span>
											{pendingCount > 0 && (
												<span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
													{pendingCount}
												</span>
											)}
										</DropdownMenuItem>
									</Link>
								</div>

								<div className="py-1 border-t border-gray-100">
									<DropdownMenuItem
										className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
										onClick={handleSignOut}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											className="w-4 h-4"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
											/>
										</svg>
										Sign Out
									</DropdownMenuItem>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<GoogleSignInButton />
					)}
				</div>
			</div>
		</header>
	)
})

export default Header
