"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginInput, loginSchema } from "@/lib/validations/auth"
import Link from "next/link"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import googleLogo from "@/public/google.svg"
import { signInWithGoogle, signInWithPassword } from "@/lib/utils/auth"
import { useToast } from "@/hooks/use-toast"

function Login() {
	const [isLoading, setIsLoading] = useState(false)
	const { toast } = useToast()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
	})

	// const onSubmit = async (data: LoginInput) => {
	// 	try {
	// 		setIsLoading(true)
	// 		const { data: authData, error } = await signInWithPassword(data)

	// 		if (error) {
	// 			throw error
	// 		}

	// 		router.push("/")
	// 	} catch (error) {
	// 		toast({
	// 			variant: "destructive",
	// 			title: "Error",
	// 			description: error instanceof Error ? error.message : String(error),
	// 		})
	// 		console.error("Login failed:", error)
	// 	} finally {
	// 		setIsLoading(false)
	// 	}
	// }

	const handleGoogleSignIn = async () => {
		try {
			setIsLoading(true)
			const { error } = await signInWithGoogle()

			if (error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: error.message,
				})
				console.error("Failed to sign in with Google:", error)
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
			<section className="w-full max-w-sm space-y-8">
				<header>
					<h1 className="text-2xl font-bold">Log In</h1>
				</header>

				<section className="space-y-6">
					<Button
						variant="outline"
						className="w-full flex items-center justify-center space-x-2"
						onClick={handleGoogleSignIn}
						disabled={isLoading}
					>
						<img src={googleLogo.src} alt="Google logo" className="w-5 h-5" />
						<span>Log In with Google</span>
					</Button>

					{/* <div
						className="flex items-center w-full"
						role="separator"
						aria-label="or"
					>
						<div className="flex-grow h-px bg-gray-300"></div>
						<span className="px-4 text-sm text-gray-500">OR</span>
						<div className="flex-grow h-px bg-gray-300"></div>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<fieldset className="space-y-4">
							<legend className="sr-only">Login form</legend>

							<div className="space-y-2">
								<label htmlFor="email" className="text-sm font-medium">
									Email
								</label>
								<Input
									{...register("email")}
									id="email"
									type="email"
									placeholder="name@example.com"
								/>
								{errors.email && (
									<p className="text-sm text-red-500">{errors.email.message}</p>
								)}
							</div>

							<div className="space-y-2">
								<label htmlFor="password" className="text-sm font-medium">
									Password
								</label>
								<Input
									{...register("password")}
									id="password"
									type="password"
									placeholder="••••••••"
									aria-describedby="password-error"
								/>
								{errors.password && (
									<p className="text-sm text-red-500">
										{errors.password.message}
									</p>
								)}
							</div>

							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? "Logging in..." : "Log In"}
							</Button>
						</fieldset>
					</form> */}
				</section>

				<footer className="text-center">
					<p className="text-sm text-gray-500">
						or{" "}
						<Link href="/sign-up" className="text-blue-600 hover:underline">
							Sign Up
						</Link>
					</p>
				</footer>
			</section>
		</main>
	)
}

export default Login
