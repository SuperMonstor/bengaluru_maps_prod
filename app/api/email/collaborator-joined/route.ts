import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Email template
const getCollaboratorJoinedTemplate = (
	mapTitle: string,
	collaboratorName: string,
	mapUrl: string
) => {
	return `
    <h1>New Collaborator Joined</h1>
    <p>Hello,</p>
    <p><strong>${collaboratorName}</strong> has accepted your invite and joined your map "${mapTitle}" as a collaborator.</p>
    <p>They can now add and edit locations on your map.</p>
    <p><a href="${mapUrl}">View Map</a></p>
    <p>Thank you for using Bengaluru Maps!</p>
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

		const { ownerEmail, mapTitle, collaboratorName, mapUrl } = body

		// Validate required fields
		if (!ownerEmail || !mapTitle || !collaboratorName || !mapUrl) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields",
					missingFields: {
						ownerEmail: !ownerEmail,
						mapTitle: !mapTitle,
						collaboratorName: !collaboratorName,
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
			subject: `${collaboratorName} joined your map "${mapTitle}"`,
			html: getCollaboratorJoinedTemplate(mapTitle, collaboratorName, mapUrl),
		}

		// Check if Resend is configured
		if (!resendApiKey || !resend) {
			if (process.env.NODE_ENV === "development") {
				console.log(
					"[Collaborator Joined Email API] FALLBACK: Email would have been sent to:",
					ownerEmail
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
