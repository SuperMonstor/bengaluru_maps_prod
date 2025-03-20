"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/context/AuthContext"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// List of authorized emails that can access this page
const AUTHORIZED_EMAILS = ["senthilsudarshan@gmail.com"]

export default function TestEmailPage() {
	const { user, isLoading } = useAuth()
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<any>(null)
	const [error, setError] = useState<string | null>(null)
	const [formData, setFormData] = useState({
		ownerEmail: "",
		mapTitle: "Test Map",
		locationName: "Test Location",
		submitterName: "Test User",
		mapUrl: "https://bengalurumaps.com/maps/test-map/123",
	})

	// Add information about the sender email
	const senderEmail = "sudarshan@bobscompany.co"

	// Debug logs
	useEffect(() => {
		console.log("[TestEmail] Current state:", {
			isLoading,
			user,
			userEmail: user?.email,
			isAuthorized: user?.email && AUTHORIZED_EMAILS.includes(user.email),
		})
	}, [user, isLoading])

	// Check if user is authorized
	useEffect(() => {
		if (isLoading) {
			console.log("[TestEmail] Auth is still loading...")
			return
		}

		if (!user) {
			console.log("[TestEmail] No user found, will redirect to home")
			// Add a small delay to ensure logs are captured
			setTimeout(() => router.push("/"), 100)
			return
		}

		// Check if user's email is in the authorized list
		if (user.email && !AUTHORIZED_EMAILS.includes(user.email)) {
			console.log("[TestEmail] User not authorized:", user.email)
			// Add a small delay to ensure logs are captured
			setTimeout(() => router.push("/"), 100)
		} else {
			console.log("[TestEmail] User authorized:", user.email)
		}
	}, [user, router, isLoading])

	// Show loading state while auth is being checked
	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<h1 className="text-2xl font-bold mb-6">Loading...</h1>
				<p>Checking authorization...</p>
			</div>
		)
	}

	// Show access denied with more details
	if (!user || (user.email && !AUTHORIZED_EMAILS.includes(user.email))) {
		return (
			<div className="container mx-auto py-8 px-4">
				<h1 className="text-2xl font-bold mb-6">Access Denied</h1>
				<p>You are not authorized to access this page.</p>
				<div className="mt-4 p-4 bg-gray-100 rounded">
					<p className="text-sm text-gray-600">Debug Info:</p>
					<p className="text-sm text-gray-600">
						User Email: {user?.email || "Not logged in"}
					</p>
					<p className="text-sm text-gray-600">
						Auth Loading: {isLoading ? "Yes" : "No"}
					</p>
					<p className="text-sm text-gray-600">
						Authorized Emails: {AUTHORIZED_EMAILS.join(", ")}
					</p>
				</div>
			</div>
		)
	}

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const sendTestEmail = async () => {
		try {
			setLoading(true)
			setError(null)
			setResult(null)

			if (!formData.ownerEmail) {
				setError("Email address is required")
				return
			}

			console.log("Sending test email to:", formData.ownerEmail)
			const response = await fetch("/api/email/test-send", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					to: formData.ownerEmail,
					subject: `Test Email for ${formData.mapTitle}`,
					message: `This is a test email for location "${formData.locationName}" submitted by ${formData.submitterName}. The map URL is: ${formData.mapUrl}`,
				}),
			})

			const result = await response.json()
			console.log("Email API response:", result)

			setResult(result)
		} catch (err) {
			console.error("Error sending test email:", err)
			setError(
				err instanceof Error ? err.message : "Unknown error sending email"
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-2xl font-bold mb-6">Email Testing Page</h1>

			<div className="space-y-4 mb-8 max-w-2xl">
				<h2 className="text-xl font-semibold">Send Test Email</h2>

				<div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
					<p className="text-blue-700">
						Sending from: <strong>{senderEmail}</strong>
					</p>
					<p className="text-sm text-blue-600 mt-1">
						If the domain is not verified, the system will automatically fall
						back to using Resend's sandbox domain.
					</p>
				</div>

				<div>
					<Label htmlFor="ownerEmail">Email Address (required)</Label>
					<Input
						id="ownerEmail"
						name="ownerEmail"
						value={formData.ownerEmail}
						onChange={handleChange}
						placeholder="Enter recipient email"
						className="w-full"
					/>
				</div>

				<div>
					<Label htmlFor="mapTitle">Map Title</Label>
					<Input
						id="mapTitle"
						name="mapTitle"
						value={formData.mapTitle}
						onChange={handleChange}
						className="w-full"
					/>
				</div>

				<div>
					<Label htmlFor="locationName">Location Name</Label>
					<Input
						id="locationName"
						name="locationName"
						value={formData.locationName}
						onChange={handleChange}
						className="w-full"
					/>
				</div>

				<div>
					<Label htmlFor="submitterName">Submitter Name</Label>
					<Input
						id="submitterName"
						name="submitterName"
						value={formData.submitterName}
						onChange={handleChange}
						className="w-full"
					/>
				</div>

				<div>
					<Label htmlFor="mapUrl">Map URL</Label>
					<Input
						id="mapUrl"
						name="mapUrl"
						value={formData.mapUrl}
						onChange={handleChange}
						className="w-full"
					/>
				</div>

				<div className="mt-4">
					<Button
						onClick={sendTestEmail}
						disabled={loading || !formData.ownerEmail}
						className="bg-green-600 hover:bg-green-700"
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending...
							</>
						) : (
							"Send Test Email"
						)}
					</Button>
				</div>
			</div>

			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4 max-w-2xl">
					<h3 className="text-red-700 font-medium">Error</h3>
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{result && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-md max-w-2xl">
					<h3 className="text-green-700 font-medium">Result</h3>
					<pre className="bg-white p-4 rounded mt-2 overflow-auto max-h-96 text-sm">
						{JSON.stringify(result, null, 2)}
					</pre>
				</div>
			)}
		</div>
	)
}
