import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
console.log("[Email API] RESEND_API_KEY configured:", !!resendApiKey)
console.log(
	"[Email API] RESEND_API_KEY length:",
	resendApiKey ? resendApiKey.length : 0
)

// Create Resend instance
let resend: Resend | null = null
try {
	resend = new Resend(resendApiKey)
	console.log("[Email API] Resend instance created successfully")
} catch (error) {
	console.error("[Email API] Error creating Resend instance:", error)
}

// Email templates
const getSubmissionNotificationTemplate = (
	mapTitle: string,
	locationName: string,
	submitterName: string,
	mapUrl: string
) => {
	// Ensure the URL ends with /pending
	const reviewUrl = mapUrl.endsWith("/pending") ? mapUrl : `${mapUrl}/pending`

	console.log("[Email API] Using review URL:", reviewUrl)

	return `
    <h1>New Location Submission</h1>
    <p>Hello,</p>
    <p>A new location has been submitted to your map "${mapTitle}".</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Submitted by:</strong> ${submitterName}</p>
    <p>Please review this submission by visiting your map's pending submissions page.</p>
    <p><a href="${reviewUrl}">Review Submission</a></p>
    <p>Thank you for using Bengaluru Maps!</p>
  `
}

export async function POST(request: NextRequest) {
	console.log("[Email API] Route handler started")

	try {
		// Log API key status (don't log the actual key)
		console.log("[Email API] RESEND_API_KEY configured:", !!resendApiKey)
		console.log("[Email API] Resend instance created:", !!resend)

		// Parse request body
		let body
		try {
			body = await request.json()
			console.log("[Email API] Request body parsed successfully")
		} catch (parseError) {
			console.error("[Email API] Error parsing request body:", parseError)
			return NextResponse.json(
				{ success: false, error: "Invalid JSON in request body" },
				{ status: 400 }
			)
		}

		const { ownerEmail, mapTitle, locationName, submitterName, mapUrl } = body

		console.log("[Email API] Email request received with params:", {
			ownerEmail: ownerEmail ? "✓" : "✗",
			mapTitle: mapTitle ? "✓" : "✗",
			locationName: locationName ? "✓" : "✗",
			submitterName: submitterName ? "✓" : "✗",
			mapUrl: mapUrl ? "✓" : "✗",
		})

		// Validate required fields
		if (
			!ownerEmail ||
			!mapTitle ||
			!locationName ||
			!submitterName ||
			!mapUrl
		) {
			console.error("[Email API] Missing required fields for email")
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields",
					missingFields: {
						ownerEmail: !ownerEmail,
						mapTitle: !mapTitle,
						locationName: !locationName,
						submitterName: !submitterName,
						mapUrl: !mapUrl,
					},
				},
				{ status: 400 }
			)
		}

		// Prepare email payload
		const emailPayload = {
			from: "Bengaluru Maps <sudarshan@bobscompany.co>",
			to: ownerEmail,
			subject: `New Location Submission: ${locationName}`,
			html: getSubmissionNotificationTemplate(
				mapTitle,
				locationName,
				submitterName,
				mapUrl
			),
		}

		console.log("[Email API] Email payload prepared:", {
			from: emailPayload.from,
			to: emailPayload.to,
			subject: emailPayload.subject,
		})

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			console.error(
				"[Email API] RESEND_API_KEY is not configured or Resend instance failed to initialize"
			)

			// Log the email that would have been sent
			console.log(
				"[Email API] FALLBACK: Email would have been sent with the following details:"
			)
			console.log("[Email API] FALLBACK: To:", ownerEmail)
			console.log(
				"[Email API] FALLBACK: Subject:",
				`New Location Submission: ${locationName}`
			)
			console.log(
				"[Email API] FALLBACK: Content:",
				getSubmissionNotificationTemplate(
					mapTitle,
					locationName,
					submitterName,
					mapUrl
				)
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

		console.log("[Email API] Sending email via Resend...")
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
					"[Email API] Custom domain not verified, trying with Resend sandbox domain..."
				)

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				console.log("[Email API] Using sandbox domain:", sandboxPayload.from)
				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				console.error("[Email API] Error from Resend API:", error)
				return NextResponse.json(
					{ success: false, error, details: "Resend API error" },
					{ status: 500 }
				)
			}

			console.log("[Email API] Email sent successfully:", data)
			return NextResponse.json({ success: true, data })
		} catch (resendError) {
			console.error("[Email API] Exception from Resend:", resendError)
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
		console.error("[Email API] Unhandled exception in email API route:", error)
		if (error instanceof Error) {
			console.error("[Email API] Error stack:", error.stack)
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
