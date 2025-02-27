"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SignUpInput, signUpSchema } from "@/lib/validations/auth"
import Link from "next/link"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import googleLogo from "@/public/google.svg"
import { useToast } from "@/lib/hooks/use-toast"
import { signInWithGoogle } from "@/lib/utils/auth"

function Signup() {
	const [isLoading, setIsLoading] = useState(false)
	const { toast } = useToast()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignUpInput>({
		resolver: zodResolver(signUpSchema),
	})

	const onSubmit = async (data: SignUpInput) => {
		// TODO: Implement your form submission logic
		console.log(data)
	}

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
		<main className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
			<section className="w-full max-w-sm space-y-8">
				<header>
					<h1 className="text-2xl font-bold">Sign Up</h1>
				</header>

				<section className="space-y-6">
					<Button
						variant="outline"
						className="w-full flex items-center justify-center space-x-2"
						onClick={signInWithGoogle}
						disabled={isLoading}
					>
						<img src={googleLogo.src} alt="Google logo" className="w-5 h-5" />
						<span>Sign Up with Google</span>
					</Button>
					{/* 
					<div
						className="flex items-center w-full"
						role="separator"
						aria-label="or"
					>
						<div className="flex-grow h-px bg-gray-300"></div>
						<span className="px-4 text-sm text-gray-500">OR</span>
						<div className="flex-grow h-px bg-gray-300"></div>
					</div>

					<form className="space-y-4">
						<fieldset className="space-y-4">
							<legend className="sr-only">Sign up form</legend>

							<div className="space-y-2">
								<label htmlFor="email" className="text-sm font-medium">
									Email
								</label>
								<Input
									// {...register("email")}
									id="email"
									type="email"
									placeholder="name@example.com"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="password" className="text-sm font-medium">
									Password
								</label>
								<Input
									// {...register('password')}
									id="password"
									type="password"
									placeholder="••••••••"
									aria-describedby="password-error"
								/>
							</div>

							<div className="space-y-2">
								<label
									htmlFor="confirmPassword"
									className="text-sm font-medium"
								>
									Confirm Password
								</label>
								<Input
									// {...register('confirmPassword')}
									id="confirmPassword"
									type="password"
									placeholder="••••••••"
									aria-describedby="confirm-password-error"
								/>
							</div>

							<Button type="submit" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? "Signing up..." : "Sign Up"}
							</Button>
						</fieldset>
					</form> */}
				</section>
				<footer className="text-center">
					<p className="text-sm text-gray-500">
						or{" "}
						<Link href="/login" className="text-blue-600 hover:underline">
							Log In
						</Link>
					</p>
				</footer>
			</section>
		</main>
	)
}

export default Signup
