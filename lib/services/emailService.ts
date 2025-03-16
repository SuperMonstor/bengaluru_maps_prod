import { Resend } from "resend"

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
const getSubmissionNotificationTemplate = (
	mapTitle: string,
	locationName: string,
	submitterName: string,
	mapUrl: string
) => {
	return `
    <h1>New Location Submission</h1>
    <p>Hello,</p>
    <p>A new location has been submitted to your map "${mapTitle}".</p>
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Submitted by:</strong> ${submitterName}</p>
    <p>Please review this submission by visiting your map's pending submissions page.</p>
    <p><a href="${mapUrl}/pending">Review Submission</a></p>
    <p>Thank you for using Bengaluru Townsquare!</p>
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
    <p>Thank you for contributing to Bengaluru Townsquare!</p>
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
    <p>Thank you for your understanding and for using Bengaluru Townsquare!</p>
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
	try {
		const { data, error } = await resend.emails.send({
			from: "Bengaluru Townsquare <notifications@bengalurutownsquare.com>",
			to: ownerEmail,
			subject: `New Location Submission: ${locationName}`,
			html: getSubmissionNotificationTemplate(
				mapTitle,
				locationName,
				submitterName,
				mapUrl
			),
		})

		if (error) {
			console.error("Error sending submission notification:", error)
			return { success: false, error }
		}

		return { success: true, data }
	} catch (error) {
		console.error("Error sending submission notification:", error)
		return { success: false, error }
	}
}

export async function sendApprovalNotification(
	submitterEmail: string,
	mapTitle: string,
	locationName: string,
	mapUrl: string
) {
	try {
		const { data, error } = await resend.emails.send({
			from: "Bengaluru Townsquare <notifications@bengalurutownsquare.com>",
			to: submitterEmail,
			subject: `Your Location "${locationName}" Has Been Approved`,
			html: getApprovalNotificationTemplate(mapTitle, locationName, mapUrl),
		})

		if (error) {
			console.error("Error sending approval notification:", error)
			return { success: false, error }
		}

		return { success: true, data }
	} catch (error) {
		console.error("Error sending approval notification:", error)
		return { success: false, error }
	}
}

export async function sendRejectionNotification(
	submitterEmail: string,
	mapTitle: string,
	locationName: string
) {
	try {
		const { data, error } = await resend.emails.send({
			from: "Bengaluru Townsquare <notifications@bengalurutownsquare.com>",
			to: submitterEmail,
			subject: `Update on Your Location Submission: ${locationName}`,
			html: getRejectionNotificationTemplate(mapTitle, locationName),
		})

		if (error) {
			console.error("Error sending rejection notification:", error)
			return { success: false, error }
		}

		return { success: true, data }
	} catch (error) {
		console.error("Error sending rejection notification:", error)
		return { success: false, error }
	}
}
