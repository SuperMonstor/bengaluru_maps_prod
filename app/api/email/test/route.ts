import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	console.log("[Email Test API] Test endpoint called")

	// Check if the Resend API key is configured
	const resendApiKey = process.env.RESEND_API_KEY

	return NextResponse.json({
		success: true,
		message: "Email API test endpoint is working",
		config: {
			resendApiKeyConfigured: !!resendApiKey,
			resendApiKeyLength: resendApiKey ? resendApiKey.length : 0,
			nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "(not set)",
			nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || "(not set)",
		},
	})
}

export async function POST(request: NextRequest) {
	console.log("[Email Test API] Test POST endpoint called")

	let body
	try {
		body = await request.json()
		console.log("[Email Test API] Request body:", body)
	} catch (error) {
		console.log("[Email Test API] No JSON body or invalid JSON")
		body = null
	}

	return NextResponse.json({
		success: true,
		message: "Email test POST endpoint is working",
		receivedData: body ? true : false,
		timestamp: new Date().toISOString(),
		resendConfigured: !!process.env.RESEND_API_KEY,
	})
}
