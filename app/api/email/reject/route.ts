import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
console.log("[Rejection Email API] RESEND_API_KEY configured:", !!resendApiKey)
console.log(
	"[Rejection Email API] RESEND_API_KEY length:",
	resendApiKey ? resendApiKey.length : 0
)

// Create Resend instance
let resend: Resend | null = null
try {
	resend = new Resend(resendApiKey)
	console.log("[Rejection Email API] Resend instance created successfully")
} catch (error) {
	console.error("[Rejection Email API] Error creating Resend instance:", error)
}

// Email template
const getRejectionNotificationTemplate = (
	mapTitle: string,
	locationName: string
) => {
	return `
    <h1>Location Submission Update</h1>
    <p>Hello,</p>
    <p>Your submission "${locationName}" for the map "${mapTitle}" was not approved at this time.</p>
    <p>This could be due to various reasons such as duplicate entries, insufficient information, or not meeting the map's criteria.</p>
    <p>Feel free to submit another location that better fits the map's theme.</p>
    <p>Thank you for your understanding and for using Bengaluru Maps!</p>
  `
}

export async function POST(request: NextRequest) {
	console.log("[Rejection Email API] Route handler started")

	try {
		// Log API key status (don't log the actual key)
		console.log(
			"[Rejection Email API] RESEND_API_KEY configured:",
			!!resendApiKey
		)
		console.log("[Rejection Email API] Resend instance created:", !!resend)

		// Parse request body
		let body
		try {
			body = await request.json()
			console.log("[Rejection Email API] Request body parsed successfully")
		} catch (parseError) {
			console.error(
				"[Rejection Email API] Error parsing request body:",
				parseError
			)
			return NextResponse.json(
				{ success: false, error: "Invalid JSON in request body" },
				{ status: 400 }
			)
		}

		const { submitterEmail, mapTitle, locationName } = body

		console.log("[Rejection Email API] Email request received with params:", {
			submitterEmail: submitterEmail ? "✓" : "✗",
			mapTitle: mapTitle ? "✓" : "✗",
			locationName: locationName ? "✓" : "✗",
		})

		// Validate required fields
		if (!submitterEmail || !mapTitle || !locationName) {
			console.error("[Rejection Email API] Missing required fields for email")
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields",
					missingFields: {
						submitterEmail: !submitterEmail,
						mapTitle: !mapTitle,
						locationName: !locationName,
					},
				},
				{ status: 400 }
			)
		}

		// Prepare email payload
		const emailPayload = {
			from: "Bengaluru Maps <sudarshan@bobscompany.co>",
			to: submitterEmail,
			subject: `Update on Your Location Submission: ${locationName}`,
			html: getRejectionNotificationTemplate(mapTitle, locationName),
		}

		console.log("[Rejection Email API] Email payload prepared:", {
			from: emailPayload.from,
			to: emailPayload.to,
			subject: emailPayload.subject,
		})

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			console.error(
				"[Rejection Email API] RESEND_API_KEY is not configured or Resend instance failed to initialize"
			)

			// Log the email that would have been sent
			console.log(
				"[Rejection Email API] FALLBACK: Email would have been sent with the following details:"
			)
			console.log("[Rejection Email API] FALLBACK: To:", submitterEmail)
			console.log(
				"[Rejection Email API] FALLBACK: Subject:",
				`Update on Your Location Submission: ${locationName}`
			)
			console.log(
				"[Rejection Email API] FALLBACK: Content:",
				getRejectionNotificationTemplate(mapTitle, locationName)
			)

			// Return success for testing purposes
			return NextResponse.json({
				success: true,
				data: {
					id: "fallback-email-id",
					message: "Email would have been sent (fallback mode)",
				},
				fallback: true,
			})
		}

		console.log("[Rejection Email API] Sending email via Resend...")
		try {
			// First try with the custom domain
			let result = await resend.emails.send(emailPayload)

			// If we get a domain verification error, try with Resend's sandbox domain
			if (
				result.error &&
				(result.error.message?.includes("domain is not verified") ||
					result.error.message?.includes("bobscompany.co") ||
					result.error.statusCode === 403)
			) {
				console.log(
					"[Rejection Email API] Custom domain not verified, trying with Resend sandbox domain..."
				)

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				console.log(
					"[Rejection Email API] Using sandbox domain:",
					sandboxPayload.from
				)
				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				console.error("[Rejection Email API] Error from Resend API:", error)
				return NextResponse.json(
					{ success: false, error, details: "Resend API error" },
					{ status: 500 }
				)
			}

			console.log("[Rejection Email API] Email sent successfully:", data)
			return NextResponse.json({ success: true, data })
		} catch (resendError) {
			console.error("[Rejection Email API] Exception from Resend:", resendError)
			return NextResponse.json(
				{
					success: false,
					error:
						resendError instanceof Error
							? resendError.message
							: "Unknown Resend error",
					details: "Resend exception",
				},
				{ status: 500 }
			)
		}
	} catch (error) {
		console.error(
			"[Rejection Email API] Unhandled exception in email API route:",
			error
		)
		if (error instanceof Error) {
			console.error("[Rejection Email API] Error stack:", error.stack)
		}
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				details: "Unhandled exception",
			},
			{ status: 500 }
		)
	}
}
