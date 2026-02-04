/**
 * Sanitizes email header values to prevent header injection.
 * Removes CR/LF which can be used to add extra headers.
 */
export function sanitizeEmailSubject(value: string): string {
	return value.replace(/[\r\n]+/g, " ").trim()
}
