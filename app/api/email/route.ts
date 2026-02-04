import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { validateInternalSecret } from "@/lib/utils/internalAuth"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY

// Create Resend instance
let resend: Resend | null = null
try {
	resend = new Resend(resendApiKey)
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
	try {
		// Validate internal secret
		if (!validateInternalSecret(request)) {
			return NextResponse.json(
				{ success: false, error: "Forbidden: unauthorized request" },
				{ status: 403 }
			)
		}

		// Parse request body
		let body
		try {
			body = await request.json()
		} catch (parseError) {
			console.error("[Email API] Error parsing request body:", parseError)
			return NextResponse.json(
				{ success: false, error: "Invalid JSON in request body" },
				{ status: 400 }
			)
		}

		const { ownerEmail, mapTitle, locationName, submitterName, mapUrl } = body

		// Validate required fields
		if (
			!ownerEmail ||
			!mapTitle ||
			!locationName ||
			!submitterName ||
			!mapUrl
		) {
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
			from: "Bengaluru Maps <notifications@bengalurumaps.com>",
			to: ownerEmail,
			subject: `New Location Submission: ${locationName}`,
			html: getSubmissionNotificationTemplate(
				mapTitle,
				locationName,
				submitterName,
				mapUrl
			),
		}

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			if (process.env.NODE_ENV === "development") {
				console.log(
					"[Email API] FALLBACK: Email would have been sent to:",
					ownerEmail
				)
			}

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
				console.error("[Email API] Error from Resend API:", error)
				return NextResponse.json(
					{ success: false, error, details: "Resend API error" },
					{ status: 500 }
				)
			}

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
