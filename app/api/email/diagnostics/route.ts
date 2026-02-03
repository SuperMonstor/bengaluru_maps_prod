import { NextResponse } from "next/server"

export async function GET() {
	const hasResendKey = !!process.env.RESEND_API_KEY
	const resendKeyLength = process.env.RESEND_API_KEY?.length || 0
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || null

	return NextResponse.json({
		ok: true,
		resend: {
			configured: hasResendKey,
			keyLength: resendKeyLength,
		},
		siteUrl,
		env: {
			NODE_ENV: process.env.NODE_ENV || "unknown",
		},
	})
}
