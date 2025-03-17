import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
console.log("[Approval Email API] RESEND_API_KEY configured:", !!resendApiKey)
console.log(
	"[Approval Email API] RESEND_API_KEY length:",
	resendApiKey ? resendApiKey.length : 0
)

// Create Resend instance
let resend: Resend | null = null
try {
	resend = new Resend(resendApiKey)
	console.log("[Approval Email API] Resend instance created successfully")
} catch (error) {
	console.error("[Approval Email API] Error creating Resend instance:", error)
}

// Email template
const getApprovalNotificationTemplate = (
	mapTitle: string,
	locationName: string,
	mapUrl: string
) => {
	return `
    <h1>Location Approved</h1>
    <p>Hello,</p>
    <p>Your submission "${locationName}" for the map "${mapTitle}" has been approved!</p>
    <p>You can view it on the map by clicking the link below:</p>
    <p><a href="${mapUrl}">View Map</a></p>
    <p>Thank you for contributing to Bengaluru Maps!</p>
  `
}

export async function POST(request: NextRequest) {
	console.log("[Approval Email API] Route handler started")

	try {
		// Log API key status (don't log the actual key)
		console.log(
			"[Approval Email API] RESEND_API_KEY configured:",
			!!resendApiKey
		)
		console.log("[Approval Email API] Resend instance created:", !!resend)

		// Parse request body
		let body
		try {
			body = await request.json()
			console.log("[Approval Email API] Request body parsed successfully")
		} catch (parseError) {
			console.error(
				"[Approval Email API] Error parsing request body:",
				parseError
			)
			return NextResponse.json(
				{ success: false, error: "Invalid JSON in request body" },
				{ status: 400 }
			)
		}

		const { submitterEmail, mapTitle, locationName, mapUrl } = body

		console.log("[Approval Email API] Email request received with params:", {
			submitterEmail: submitterEmail ? "✓" : "✗",
			mapTitle: mapTitle ? "✓" : "✗",
			locationName: locationName ? "✓" : "✗",
			mapUrl: mapUrl ? "✓" : "✗",
		})

		// Validate required fields
		if (!submitterEmail || !mapTitle || !locationName || !mapUrl) {
			console.error("[Approval Email API] Missing required fields for email")
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields",
					missingFields: {
						submitterEmail: !submitterEmail,
						mapTitle: !mapTitle,
						locationName: !locationName,
						mapUrl: !mapUrl,
					},
				},
				{ status: 400 }
			)
		}

		// Prepare email payload
		const emailPayload = {
			from: "Bengaluru Maps <sudarshan@bobscompany.co>",
			to: submitterEmail,
			subject: `Your Location "${locationName}" Has Been Approved`,
			html: getApprovalNotificationTemplate(mapTitle, locationName, mapUrl),
		}

		console.log("[Approval Email API] Email payload prepared:", {
			from: emailPayload.from,
			to: emailPayload.to,
			subject: emailPayload.subject,
		})

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			console.error(
				"[Approval Email API] RESEND_API_KEY is not configured or Resend instance failed to initialize"
			)

			// Log the email that would have been sent
			console.log(
				"[Approval Email API] FALLBACK: Email would have been sent with the following details:"
			)
			console.log("[Approval Email API] FALLBACK: To:", submitterEmail)
			console.log(
				"[Approval Email API] FALLBACK: Subject:",
				`Your Location "${locationName}" Has Been Approved`
			)
			console.log(
				"[Approval Email API] FALLBACK: Content:",
				getApprovalNotificationTemplate(mapTitle, locationName, mapUrl)
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

		console.log("[Approval Email API] Sending email via Resend...")
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
					"[Approval Email API] Custom domain not verified, trying with Resend sandbox domain..."
				)

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				console.log(
					"[Approval Email API] Using sandbox domain:",
					sandboxPayload.from
				)
				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				console.error("[Approval Email API] Error from Resend API:", error)
				return NextResponse.json(
					{ success: false, error, details: "Resend API error" },
					{ status: 500 }
				)
			}

			console.log("[Approval Email API] Email sent successfully:", data)
			return NextResponse.json({ success: true, data })
		} catch (resendError) {
			console.error("[Approval Email API] Exception from Resend:", resendError)
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
			"[Approval Email API] Unhandled exception in email API route:",
			error
		)
		if (error instanceof Error) {
			console.error("[Approval Email API] Error stack:", error.stack)
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
