"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useContext, useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AuthContext } from "@/lib/context/AuthContext"
import GoogleSignInButton from "@/components/GoogleSignInButton"
import { createClient } from "@/lib/supabase/service/client"

function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}

export default function Header() {
	const { user, isLoading, signOut } = useAuth()
	const [pendingCount, setPendingCount] = useState(0)
	const supabase = createClient()

	useEffect(() => {
		if (!user || isLoading) return

		const fetchPendingCount = async () => {
			try {
				// Fetch all maps owned by the user
				const { data: maps, error: mapsError } = await supabase
					.from("maps")
					.select("id")
					.eq("owner_id", user.id)

				if (mapsError) {
					console.error("Error fetching maps:", mapsError)
					setPendingCount(0)
					return
				}

				if (!maps.length) {
					setPendingCount(0)
					return
				}

				const mapIds = maps.map((map) => map.id)

				// Fetch count of unapproved locations across all user-owned maps
				const { count, error: countError } = await supabase
					.from("locations")
					.select("id", { count: "exact" })
					.in("map_id", mapIds)
					.eq("is_approved", false)

				if (countError) {
					console.error("Error fetching pending count:", countError)
					setPendingCount(0)
					return
				}

				setPendingCount(count || 0)
			} catch (error) {
				console.error("Unexpected error fetching pending count:", error)
				setPendingCount(0)
			}
		}

		fetchPendingCount()
	}, [user, isLoading])

	const handleSignOut = async () => {
		await signOut()
	}

	return (
		<div className="flex justify-between items-center p-3 md:p-4 flex-wrap gap-y-2">
			<div className="flex items-baseline space-x-1">
				<Link
					href="/"
					className="text-lg md:text-2xl sm:text-xl font-semibold hover:opacity-80"
				>
					Bengaluru Maps
				</Link>
				<Link
					href="https://x.com/realsudarshansk"
					target="_blank"
					className="text-xs text-gray-500 md:text-sm hover:underline"
				>
					By Sudarshan S
				</Link>
			</div>

			<div className="flex items-center gap-2 md:gap-3">
				{!isLoading && user && (
					<Link href="/my-maps" className="relative mr-1">
						<Button
							variant="ghost"
							size="sm"
							className="text-gray-700 hover:text-gray-900 hidden md:flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								className="w-4 h-4"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
								/>
							</svg>
							My Maps
							{pendingCount > 0 && (
								<span className="ml-1 bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
									{pendingCount}
								</span>
							)}
						</Button>
					</Link>
				)}

				<Link href="/create-map">
					<Button
						variant="outline"
						size="sm"
						className="border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 hidden sm:flex items-center gap-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							className="w-4 h-4"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create Map
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 sm:hidden w-8 h-8"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							className="w-4 h-4"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
					</Button>
				</Link>

				{isLoading ? (
					<div className="h-8 w-8 md:h-9 md:w-9 animate-pulse bg-gray-300 rounded-full" />
				) : user ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-8 w-8 md:h-9 md:w-9 rounded-full p-0 overflow-visible border-2 border-transparent hover:border-primary/20 transition-colors"
							>
								<div className="relative h-full w-full overflow-hidden rounded-full">
									<Avatar className="h-full w-full">
										<AvatarImage
											src={
												user.picture_url ??
												`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
											}
											alt={`${user.first_name} ${user.last_name}`}
										/>
										<AvatarFallback className="bg-primary/10 text-primary font-medium">
											{user.first_name?.[0]?.toUpperCase() ||
												user.email?.[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</div>

								{pendingCount > 0 && (
									<div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white shadow-sm md:hidden">
										{pendingCount > 99 ? "99+" : pendingCount}
									</div>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							sideOffset={8}
							className="w-[calc(100vw-2rem)] max-w-[320px] p-0 bg-white shadow-lg rounded-lg border border-gray-100"
						>
							<div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10 border border-gray-200">
										<AvatarImage
											src={
												user.picture_url ??
												`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
											}
										/>
										<AvatarFallback className="bg-primary/10 text-primary font-medium">
											{user.first_name?.[0]?.toUpperCase() ||
												user.email?.[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="font-semibold text-gray-900">
											{user.first_name} {user.last_name}
										</span>
										<span className="text-xs text-gray-500 truncate max-w-[180px]">
											{user.email}
										</span>
									</div>
								</div>
							</div>

							<div className="py-1 md:hidden">
								<Link href="/my-maps">
									<DropdownMenuItem className="cursor-pointer flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
										<div className="flex items-center gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												className="w-4 h-4 text-gray-500"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
												/>
											</svg>
											My Maps
										</div>
										{pendingCount > 0 && (
											<span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
												{pendingCount} pending
											</span>
										)}
									</DropdownMenuItem>
								</Link>

								<Link href="/create-map">
									<DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 md:hidden">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											className="w-4 h-4 text-gray-500"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
										Create New Map
									</DropdownMenuItem>
								</Link>
							</div>

							<div className="border-t border-gray-100">
								<DropdownMenuItem
									onClick={handleSignOut}
									className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										className="w-4 h-4"
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
	)
}
