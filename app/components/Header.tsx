"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/utils/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Header() {
	const [isSignedIn, setIsSignedIn] = useState(false)
	const [userName, setUserName] = useState("Account")
	const router = useRouter()
	const supabase = createClient()

	useEffect(() => {
		const checkUser = async () => {
			const { data } = await supabase.auth.getUser()
			setIsSignedIn(!!data.user)
			setUserName(data.user?.email || "Account")
		}

		checkUser()

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setIsSignedIn(!!session)
			setUserName(session?.user?.email || "Account")
		})

		return () => subscription.unsubscribe()
	}, [])

	const handleSignOut = async () => {
		await supabase.auth.signOut()
		router.refresh()
	}

	return (
		<div className="flex justify-between items-center p-4">
			<div className="flex items-baseline space-x-1">
				<h1 className="text-sm md:text-2xl sm:text-xl font-semibold">
					Bengaluru Maps
				</h1>
				<Link
					href="https://x.com/realsudarshansk"
					target="_blank"
					className="text-xs text-gray-500 md:text-sm hover:underline"
				>
					By Sudarshan S
				</Link>
			</div>

			<div className="flex items-center space-x-2">
				<Button variant="default">Submit List</Button>
				{isSignedIn ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Avatar className="h-8 w-8 cursor-pointer hover:opacity-75">
								<AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg" />
								<AvatarFallback>
									{userName.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={handleSignOut}>
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
