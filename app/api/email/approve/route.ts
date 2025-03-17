import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Only log in development
if (process.env.NODE_ENV === "development") {
	console.log("[Approval Email API] Resend configured:", !!resend)
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
	try {
		// Parse request body
		let body
		try {
			body = await request.json()
		} catch (parseError) {
			return NextResponse.json(
				{ success: false, error: "Invalid JSON in request body" },
				{ status: 400 }
			)
		}

		const { submitterEmail, mapTitle, locationName, mapUrl } = body

		// Validate required fields
		if (!submitterEmail || !mapTitle || !locationName || !mapUrl) {
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

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			if (process.env.NODE_ENV === "development") {
				console.log(
					"[Approval Email API] FALLBACK: Email would have been sent to:",
					submitterEmail
				)
			}

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
				if (process.env.NODE_ENV === "development") {
					console.log("[Approval Email API] Using sandbox domain as fallback")
				}

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				return NextResponse.json(
					{ success: false, error, details: "Resend API error" },
					{ status: 500 }
				)
			}

			return NextResponse.json({ success: true, data })
		} catch (resendError) {
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
