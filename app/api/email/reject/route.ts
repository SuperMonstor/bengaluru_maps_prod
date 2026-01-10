import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Only log in development
if (process.env.NODE_ENV === "development") {
	console.log("[Rejection Email API] Resend configured:", !!resend)
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

		const { submitterEmail, mapTitle, locationName } = body

		// Validate required fields
		if (!submitterEmail || !mapTitle || !locationName) {
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
			from: "Bengaluru Maps <notifications@bengalurumaps.com>",
			to: submitterEmail,
			subject: `Update on Your Location Submission: ${locationName}`,
			html: getRejectionNotificationTemplate(mapTitle, locationName),
		}

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			if (process.env.NODE_ENV === "development") {
				console.log(
					"[Rejection Email API] FALLBACK: Email would have been sent to:",
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
			const { data, error } = await resend.emails.send(emailPayload)

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
