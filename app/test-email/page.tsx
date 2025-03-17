"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function TestEmailPage() {
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

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const testEmailApi = async () => {
		try {
			setLoading(true)
			setError(null)
			setResult(null)

			console.log("Testing email API endpoint...")
			const testResponse = await fetch("/api/email/test", {
				method: "GET",
			})
			const testResult = await testResponse.json()
			console.log("Email API test response:", testResult)

			setResult({
				testEndpoint: testResult,
			})
		} catch (err) {
			console.error("Error testing email API:", err)
			setError(err instanceof Error ? err.message : "Unknown error testing API")
		} finally {
			setLoading(false)
		}
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

			console.log("Sending test email with data:", formData)
			const response = await fetch("/api/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			})

			const result = await response.json()
			console.log("Email API response:", result)

			setResult({
				emailSend: result,
			})
		} catch (err) {
			console.error("Error sending test email:", err)
			setError(
				err instanceof Error ? err.message : "Unknown error sending email"
			)
		} finally {
			setLoading(false)
		}
	}

	const sendDirectTestEmail = async () => {
		try {
			setLoading(true)
			setError(null)
			setResult(null)

			if (!formData.ownerEmail) {
				setError("Email address is required")
				return
			}

			console.log("Sending direct test email to:", formData.ownerEmail)
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
			console.log("Direct email API response:", result)

			setResult({
				directEmailSend: result,
			})
		} catch (err) {
			console.error("Error sending direct test email:", err)
			setError(
				err instanceof Error
					? err.message
					: "Unknown error sending direct email"
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-2xl font-bold mb-6">Email Testing Page</h1>

			<div className="mb-8">
				<Button onClick={testEmailApi} disabled={loading} className="mb-4">
					Test Email API Endpoint
				</Button>
			</div>

			<div className="space-y-4 mb-8">
				<h2 className="text-xl font-semibold">Send Test Email</h2>

				<div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
					<p className="text-blue-700">
						Sending from: <strong>{senderEmail}</strong> (Make sure this domain
						is verified in Resend)
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

				<div className="flex space-x-4 mt-4">
					<Button
						onClick={sendTestEmail}
						disabled={loading || !formData.ownerEmail}
						className="bg-blue-600 hover:bg-blue-700"
					>
						Send Test Email (Original API)
					</Button>

					<Button
						onClick={sendDirectTestEmail}
						disabled={loading || !formData.ownerEmail}
						className="bg-green-600 hover:bg-green-700"
					>
						Send Direct Test Email (New API)
					</Button>
				</div>
			</div>

			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
					<h3 className="text-red-700 font-medium">Error</h3>
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{result && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-md">
					<h3 className="text-green-700 font-medium">Result</h3>
					<pre className="bg-white p-4 rounded mt-2 overflow-auto max-h-96">
						{JSON.stringify(result, null, 2)}
					</pre>
				</div>
			)}
		</div>
	)
}
