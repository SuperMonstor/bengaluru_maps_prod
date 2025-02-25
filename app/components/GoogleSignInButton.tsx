"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import googleLogo from "@/public/google.svg"
import { signInWithGoogle } from "@/lib/utils/auth"
import { useToast } from "@/hooks/use-toast"

export default function GoogleSignInButton() {
	const { toast } = useToast()

	const handleGoogleSignIn = async () => {
		try {
			const { error } = await signInWithGoogle()

			if (error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: error.message,
				})
				console.error("Failed to sign in with Google:", error)
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: error instanceof Error ? error.message : String(error),
			})
			console.error("Failed to sign in with Google:", error)
		}
	}

	return (
		<Button 
			variant="outline"
			onClick={handleGoogleSignIn}
			className="flex items-center gap-2"
		>
			<Image
				src={googleLogo}
				alt="Google logo"
				className="w-4 h-4"
			/>
			<span className="hidden sm:inline">Sign In with Google</span>
			<span className="sm:hidden">Sign In</span>
		</Button>
	)
} 