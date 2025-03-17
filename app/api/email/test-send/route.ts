import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

console.log("[Email Test Send API] Resend configured:", !!resend)
console.log("[Email Test Send API] API key length:", resendApiKey?.length || 0)

export async function POST(request: NextRequest) {
	console.log("[Email Test Send API] Test send endpoint called")

	try {
		// Parse request body
		const body = await request.json()
		const {
			to,
			subject = "Test Email from Bengaluru Maps",
			message = "This is a test email",
		} = body

		console.log("[Email Test Send API] Sending test email to:", to)

		// Validate email address
		if (!to || typeof to !== "string" || !to.includes("@")) {
			return NextResponse.json(
				{ error: "Valid recipient email address is required" },
				{ status: 400 }
			)
		}

		// Check if Resend is configured
		if (!resend) {
			console.error(
				"[Email Test Send API] Resend not configured - missing API key"
			)
			return NextResponse.json(
				{ error: "Email service not configured" },
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

		console.log(
			"[Email Test Send API] Sending email with payload:",
			JSON.stringify(payload)
		)

		// Try to send email
		try {
			const result = await resend.emails.send(payload)
			console.log(
				"[Email Test Send API] Email sent successfully:",
				JSON.stringify(result)
			)

			return NextResponse.json({
				success: true,
				message: "Test email sent successfully",
				result,
			})
		} catch (error: any) {
			console.error("[Email Test Send API] Error from Resend API:", error)

			// Check if it's a domain verification error
			if (
				error.message?.includes("domain is not verified") ||
				error.message?.includes("bobscompany.co") ||
				error.statusCode === 403
			) {
				console.log(
					"[Email Test Send API] Domain verification error, trying sandbox domain"
				)

				// Try with sandbox domain
				try {
					const sandboxPayload = {
						...payload,
						from: "Bengaluru Maps <onboarding@resend.dev>",
					}

					console.log(
						"[Email Test Send API] Sending with sandbox domain:",
						JSON.stringify(sandboxPayload)
					)

					const sandboxResult = await resend.emails.send(sandboxPayload)
					console.log(
						"[Email Test Send API] Email sent with sandbox domain:",
						JSON.stringify(sandboxResult)
					)

					return NextResponse.json({
						success: true,
						message: "Test email sent successfully using sandbox domain",
						result: sandboxResult,
						note: "Used sandbox domain due to domain verification issues",
					})
				} catch (sandboxError: any) {
					console.error(
						"[Email Test Send API] Error with sandbox domain:",
						sandboxError
					)
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
		console.error("[Email Test Send API] Unhandled exception:", error)
		return NextResponse.json(
			{ error: "Internal server error", details: error.message },
			{ status: 500 }
		)
	}
}
