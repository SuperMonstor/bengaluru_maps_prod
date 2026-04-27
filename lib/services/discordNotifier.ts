const TIMEOUT_MS = 3000

export async function notifyDiscordNewMap(params: {
	title: string
	slug: string
	creatorEmail?: string | null
}): Promise<void> {
	const webhookUrl = process.env.DISCORD_MAP_WEBHOOK_URL
	if (!webhookUrl) return

	const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bengalurumaps.in").replace(/\/$/, "")
	const mapUrl = `${siteUrl}/maps/${params.slug}`
	const byLine = params.creatorEmail ? `\nby ${params.creatorEmail}` : ""
	const content = `New map created: **${params.title}**${byLine}\n${mapUrl}`

	try {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content }),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		})
		if (!response.ok) {
			console.error(`Discord webhook failed: ${response.status} ${response.statusText}`)
		}
	} catch (err) {
		console.error("Discord webhook error:", err)
	}
}
