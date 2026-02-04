/**
 * Validates that an incoming request has a valid internal API secret.
 * Used to protect internal-only API routes (e.g. email sending)
 * from being called by external parties.
 *
 * Server actions include this secret when calling internal routes.
 */
export function validateInternalSecret(request: Request): boolean {
	const secret = request.headers.get("x-internal-secret")
	const expectedSecret = process.env.INTERNAL_API_SECRET

	if (!expectedSecret) {
		// If no secret is configured, reject all requests as a safety default
		console.error(
			"[internalAuth] INTERNAL_API_SECRET is not configured - rejecting request"
		)
		return false
	}

	return secret === expectedSecret
}

/**
 * Returns the internal API secret for use in server action fetch calls.
 */
export function getInternalAuthHeaders(): Record<string, string> {
	return {
		"x-internal-secret": process.env.INTERNAL_API_SECRET || "",
	}
}
