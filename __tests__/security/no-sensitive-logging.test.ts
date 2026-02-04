import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("no sensitive production logging", () => {
	it("email routes should not log API key metadata unconditionally", () => {
		const emailRoutes = [
			"app/api/email/route.ts",
			"app/api/email/approve/route.ts",
			"app/api/email/reject/route.ts",
			"app/api/email/collaborator-joined/route.ts",
		]

		for (const route of emailRoutes) {
			const filePath = path.resolve(__dirname, "../..", route)
			const content = fs.readFileSync(filePath, "utf-8")

			// Should not log API key length or presence unconditionally
			// (only in development or not at all)
			const lines = content.split("\n")
			for (const line of lines) {
				// Skip lines inside development-only blocks
				if (
					line.includes("RESEND_API_KEY") &&
					line.includes("console.log")
				) {
					// This log should be inside a NODE_ENV check or removed
					// Check if there's an if(NODE_ENV === "development") context
					const lineIndex = lines.indexOf(line)
					const contextLines = lines
						.slice(Math.max(0, lineIndex - 5), lineIndex)
						.join("\n")
					const isDevelopmentGuarded =
						contextLines.includes('NODE_ENV') &&
						contextLines.includes('development')
					expect(
						isDevelopmentGuarded,
						`${route}: API key logging should be guarded by NODE_ENV check or removed: ${line.trim()}`
					).toBe(true)
				}
			}
		}
	})

	it("email routes should not log email content in production", () => {
		const mainEmailRoute = path.resolve(
			__dirname,
			"../../app/api/email/route.ts"
		)
		const content = fs.readFileSync(mainEmailRoute, "utf-8")

		// Should not have FALLBACK content logging outside dev guard
		expect(content).not.toMatch(
			/console\.log.*FALLBACK.*Content/
		)
	})
})
