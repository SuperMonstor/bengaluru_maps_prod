import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface HeaderProps {
	isSignedIn: boolean
	userName?: string
}

export default function Header({ isSignedIn, userName }: HeaderProps) {
	return (
		<div className="flex justify-between items-center p-4">
			<div className="flex items-baseline space-x-1">
				<h1 className="text-xl font-semibold">Bengaluru Maps</h1>
				<Link
					href="https://x.com/realsudarshansk"
					target="_blank"
					className="text-gray-500 text-sm hover:underline"
				>
					By Sudarshan S
				</Link>
			</div>

			<div className="flex items-center space-x-2">
				<Button variant="default">Submit List</Button>
				{isSignedIn ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">{userName || "Account"}</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>Sign Out</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<Button variant="outline">Sign In</Button>
				)}
			</div>
		</div>
	)
}
