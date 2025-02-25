"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useContext } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AuthContext } from "@/lib/context/AuthContext"
import GoogleSignInButton from "./GoogleSignInButton"

function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}

export default function Header() {
	const { user, isLoading, signOut } = useAuth()

	const handleSignOut = async () => {
		await signOut()
	}

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center justify-between px-4">
				<div className="flex items-baseline gap-1 md:gap-2">
					<Link
						href="/"
						className="text-base md:text-xl font-semibold hover:opacity-80 transition-opacity"
					>
						Bengaluru Maps
					</Link>
					<Link
						href="https://x.com/realsdarshansk"
						target="_blank"
						className="hidden sm:inline-block text-xs md:text-sm text-muted-foreground hover:underline"
					>
						By Sudarshan S
					</Link>
				</div>

				<div className="flex items-center gap-2 md:gap-4">
					<Button 
						variant="default" 
						className="hidden sm:inline-flex"
					>
						Submit List
					</Button>
					{isLoading ? (
						<div className="h-8 w-8 md:h-9 md:w-9 animate-pulse bg-gray-300 rounded-full" />
					) : user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-8 w-8 md:h-9 md:w-9 rounded-full p-0"
								>
									<Avatar className="h-8 w-8 md:h-9 md:w-9">
										<AvatarImage
											src={
												user.picture_url ??
												"https://api.dicebear.com/7.x/avataaars/svg"
											}
										/>
										<AvatarFallback>
											{user.email?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-56 bg-white shadow-md rounded-md"
							>
								<DropdownMenuItem className="px-3 py-2 text-sm border-b cursor-default select-none font-semibold text-gray-700 bg-gray-100">
									{user.first_name + " " + user.last_name}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={handleSignOut}
									className="px-3 py-2 text-sm text-red-600 hover:bg-red-100 cursor-pointer transition"
								>
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<GoogleSignInButton />
					)}
				</div>
			</div>
		</header>
	)
} 