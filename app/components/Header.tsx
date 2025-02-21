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
		<div className="flex justify-between items-center p-4">
			<div className="flex items-baseline space-x-1">
				<Link
					href="/"
					className="text-sm md:text-2xl sm:text-xl font-semibold hover:opacity-80"
				>
					Bengaluru Maps
				</Link>
				<Link
					href="https://x.com/realsdarshansk"
					target="_blank"
					className="text-xs text-gray-500 md:text-sm hover:underline"
				>
					By Sudarshan S
				</Link>
			</div>

			<div className="flex items-center gap-4">
				<Button variant="default">Submit List</Button>
				{isLoading ? (
					// Placeholder while checking authentication state
					<div className="h-10 w-10 animate-pulse bg-gray-300 rounded-full" />
				) : user ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-10 w-10 rounded-full p-0"
							>
								<Avatar className="h-9 w-9">
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
					<Link href="/login">
						<Button variant="outline">Sign In</Button>
					</Link>
				)}
			</div>
		</div>
	)
}
