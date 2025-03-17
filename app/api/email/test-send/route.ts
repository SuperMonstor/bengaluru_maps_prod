import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Only log in development
if (process.env.NODE_ENV === "development") {
	console.log("[Email API] Resend configured:", !!resend)
}

export async function POST(request: NextRequest) {
	try {
		// Parse request body
		const body = await request.json()
		const {
			to,
			subject = "Test Email from Bengaluru Maps",
			message = "This is a test email",
		} = body

		// Validate email address
		if (!to || typeof to !== "string" || !to.includes("@")) {
			return NextResponse.json(
				{ error: "Valid recipient email address is required" },
				{ status: 400 }
			)
		}

		// Check if Resend is configured
		if (!resend) {
			return NextResponse.json(
				{ error: "Email service not configured - missing API key" },
				{ status: 500 }
			)
		}

		// Prepare email payload
		const senderEmail = "sudarshan@bobscompany.co"
		const payload = {
			from: `Bengaluru Maps <${senderEmail}>`,
			to: [to],
			subject: subject,
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email from Bengaluru Maps</h1>
          <p>${message}</p>
          <p>This is a test email sent from the Bengaluru Maps application.</p>
          <p>If you received this email, the email service is working correctly.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            Sent from Bengaluru Maps at ${new Date().toISOString()}
          </p>
        </div>
      `,
		}

		// Try to send email
		try {
			const result = await resend.emails.send(payload)

			if (process.env.NODE_ENV === "development") {
				console.log("[Email API] Email sent successfully")
			}

			return NextResponse.json({
				success: true,
				message: "Test email sent successfully",
				result,
			})
		} catch (error: any) {
			// Check if it's a domain verification error
			if (
				error.message?.includes("domain is not verified") ||
				error.message?.includes("bobscompany.co") ||
				error.statusCode === 403
			) {
				if (process.env.NODE_ENV === "development") {
					console.log(
						"[Email API] Domain verification error, trying sandbox domain"
					)
				}

				// Try with sandbox domain
				try {
					const sandboxPayload = {
						...payload,
						from: "Bengaluru Maps <onboarding@resend.dev>",
					}

					const sandboxResult = await resend.emails.send(sandboxPayload)

					return NextResponse.json({
						success: true,
						message: "Test email sent successfully using sandbox domain",
						result: sandboxResult,
						note: "Used sandbox domain due to domain verification issues",
					})
				} catch (sandboxError: any) {
					return NextResponse.json(
						{
							error: "Failed to send email even with sandbox domain",
							details: sandboxError.message,
						},
						{ status: 500 }
					)
				}
			}

			return NextResponse.json(
				{ error: "Failed to send email", details: error.message },
				{ status: 500 }
			)
		}
	} catch (error: any) {
		return NextResponse.json(
			{ error: "Internal server error", details: error.message },
			{ status: 500 }
		)
	}
}
