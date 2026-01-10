"use client"

import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
let resend: Resend | null = null

if (resendApiKey) {
	resend = new Resend(resendApiKey)
} else {
	console.error("RESEND_API_KEY is not configured in environment variables")
}


// Export the resend instance so it can be checked by other modules
export { resend }

// Email templates
const getSubmissionNotificationTemplate = (
	mapTitle: string,
	locationName: string,
	submitterName: string,
	mapUrl: string
) => {
	// Ensure the URL ends with /pending
	const reviewUrl = mapUrl.endsWith("/pending") ? mapUrl : `${mapUrl}/pending`

	console.log("Using review URL:", reviewUrl)

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

// Email sending functions
export async function sendSubmissionNotification(
	ownerEmail: string,
	mapTitle: string,
	locationName: string,
	submitterName: string,
	mapUrl: string
) {
	console.log("sendSubmissionNotification called with params:", {
		ownerEmail,
		mapTitle,
		locationName,
		submitterName,
		mapUrl,
	})

	try {
		console.log("Checking Resend instance:", !!resend)
		console.log("Checking Resend API key:", !!resendApiKey)

		if (!resend || !resendApiKey) {
			console.error("Resend is not properly initialized")
			return {
				success: false,
				error: "Resend is not properly initialized. Missing API key.",
			}
		}

		if (!ownerEmail) {
			console.error("Owner email is missing")
			return {
				success: false,
				error: "Owner email is required but was not provided.",
			}
		}

		console.log("Preparing email payload")
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
		console.log("Email payload prepared:", emailPayload)

		console.log("Sending email via Resend...")
		try {
			// First try with the custom domain
			let result = await resend.emails.send(emailPayload)

			// If we get a domain verification error, try with Resend's sandbox domain
			if (
				result.error &&
				(result.error.message?.includes("domain is not verified") ||
					result.error.message?.includes("bobscompany.co") ||
					(result.error as any).statusCode === 403)
			) {
				console.log(
					"Custom domain not verified, trying with Resend sandbox domain..."
				)

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				console.log("Using sandbox domain:", sandboxPayload.from)
				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				console.error("Error from Resend API:", error)
				return { success: false, error }
			}

			console.log("Email sent successfully:", data)
			return { success: true, data }
		} catch (error) {
			console.error("Exception in sendSubmissionNotification:", error)
			if (error instanceof Error) {
				console.error("Error stack:", error.stack)
			}
			return { success: false, error }
		}
	} catch (error) {
		console.error("Exception in sendSubmissionNotification:", error)
		if (error instanceof Error) {
			console.error("Error stack:", error.stack)
		}
		return { success: false, error }
	}
}

export async function sendApprovalNotification(
	submitterEmail: string,
	mapTitle: string,
	locationName: string,
	mapUrl: string
) {
	console.log("sendApprovalNotification called with params:", {
		submitterEmail,
		mapTitle,
		locationName,
		mapUrl,
	})

	try {
		console.log("Checking Resend instance:", !!resend)
		console.log("Checking Resend API key:", !!resendApiKey)

		if (!resend || !resendApiKey) {
			console.error(
				"Resend is not properly initialized in sendApprovalNotification"
			)
			return {
				success: false,
				error: "Resend is not properly initialized. Missing API key.",
			}
		}

		if (!submitterEmail) {
			console.error("Submitter email is missing")
			return {
				success: false,
				error: "Submitter email is required but was not provided.",
			}
		}

		console.log("Preparing approval email payload")
		// First try with the custom domain
		const emailPayload = {
			from: "Bengaluru Maps <notifications@bengalurumaps.com>",
			to: submitterEmail,
			subject: `Your Location "${locationName}" Has Been Approved`,
			html: getApprovalNotificationTemplate(mapTitle, locationName, mapUrl),
		}
		console.log("Approval email payload prepared:", emailPayload)

		console.log("Sending approval email via Resend...")
		try {
			let result = await resend.emails.send(emailPayload)

			// If we get a domain verification error, try with Resend's sandbox domain
			if (
				result.error &&
				(result.error.message?.includes("domain is not verified") ||
					result.error.message?.includes("bobscompany.co") ||
					(result.error as any).statusCode === 403)
			) {
				console.log(
					"Custom domain not verified, trying with Resend sandbox domain..."
				)

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				console.log("Using sandbox domain:", sandboxPayload.from)
				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				console.error(
					"Error from Resend API in sendApprovalNotification:",
					error
				)
				return { success: false, error }
			}

			console.log("Approval email sent successfully:", data)
			return { success: true, data }
		} catch (error) {
			console.error("Exception in sendApprovalNotification:", error)
			if (error instanceof Error) {
				console.error("Error message:", error.message)
				console.error("Error stack:", error.stack)
			}
			return { success: false, error }
		}
	} catch (error) {
		console.error("Exception in sendApprovalNotification:", error)
		if (error instanceof Error) {
			console.error("Error message:", error.message)
			console.error("Error stack:", error.stack)
		}
		return { success: false, error }
	}
}

export async function sendRejectionNotification(
	submitterEmail: string,
	mapTitle: string,
	locationName: string
) {
	console.log("sendRejectionNotification called with params:", {
		submitterEmail,
		mapTitle,
		locationName,
	})

	try {
		console.log("Checking Resend instance:", !!resend)
		console.log("Checking Resend API key:", !!resendApiKey)

		if (!resend || !resendApiKey) {
			console.error(
				"Resend is not properly initialized in sendRejectionNotification"
			)
			return {
				success: false,
				error: "Resend is not properly initialized. Missing API key.",
			}
		}

		if (!submitterEmail) {
			console.error("Submitter email is missing")
			return {
				success: false,
				error: "Submitter email is required but was not provided.",
			}
		}

		console.log("Preparing rejection email payload")
		// First try with the custom domain
		const emailPayload = {
			from: "Bengaluru Maps <notifications@bengalurumaps.com>",
			to: submitterEmail,
			subject: `Update on Your Location Submission: ${locationName}`,
			html: getRejectionNotificationTemplate(mapTitle, locationName),
		}
		console.log("Rejection email payload prepared:", emailPayload)

		console.log("Sending rejection email via Resend...")
		try {
			let result = await resend.emails.send(emailPayload)

			// If we get a domain verification error, try with Resend's sandbox domain
			if (
				result.error &&
				(result.error.message?.includes("domain is not verified") ||
					result.error.message?.includes("bobscompany.co") ||
					(result.error as any).statusCode === 403)
			) {
				console.log(
					"Custom domain not verified, trying with Resend sandbox domain..."
				)

				// Use Resend's sandbox domain as fallback
				const sandboxPayload = {
					...emailPayload,
					from: "onboarding@resend.dev", // This is Resend's sandbox domain
				}

				console.log("Using sandbox domain:", sandboxPayload.from)
				result = await resend.emails.send(sandboxPayload)
			}

			const { data, error } = result

			if (error) {
				console.error(
					"Error from Resend API in sendRejectionNotification:",
					error
				)
				return { success: false, error }
			}

			console.log("Rejection email sent successfully:", data)
			return { success: true, data }
		} catch (error) {
			console.error("Exception in sendRejectionNotification:", error)
			if (error instanceof Error) {
				console.error("Error message:", error.message)
				console.error("Error stack:", error.stack)
			}
			return { success: false, error }
		}
	} catch (error) {
		console.error("Exception in sendRejectionNotification:", error)
		if (error instanceof Error) {
			console.error("Error message:", error.message)
			console.error("Error stack:", error.stack)
		}
		return { success: false, error }
	}
}
