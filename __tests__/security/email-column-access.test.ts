import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("email column access control", () => {
	it("client-side hooks should not select email from users table", () => {
		const hookPath = path.resolve(
			__dirname,
			"../../lib/hooks/useUserInfo.ts"
		)
		const content = fs.readFileSync(hookPath, "utf-8")

		// Client-side code should not query the email column
		const selectCalls = content.match(/\.select\([^)]+\)/g) || []
		for (const selectCall of selectCalls) {
			expect(selectCall).not.toContain("email")
		}
	})

	it("client-side mapsService should not select email from users", () => {
		const servicePath = path.resolve(
			__dirname,
			"../../lib/supabase/mapsService.ts"
		)
		const content = fs.readFileSync(servicePath, "utf-8")

		// Check that mapsService user queries don't include email
		const userQueries = content.split('.from("users")').slice(1)
		for (const query of userQueries) {
			const nextSelect = query.match(/\.select\([^)]+\)/)
			if (nextSelect) {
				expect(nextSelect[0]).not.toContain("email")
			}
		}
	})

	it("server-side email access should only happen in server actions", () => {
		// Only server actions (with "use server" directive) should access email
		const serverActionFiles = [
			"lib/supabase/api/approveLocationAction.ts",
			"lib/supabase/api/rejectLocationAction.ts",
		]

		for (const file of serverActionFiles) {
			const filePath = path.resolve(__dirname, "../..", file)
			const content = fs.readFileSync(filePath, "utf-8")
			// These files should have "use server" directive
			expect(content.startsWith('"use server"')).toBe(true)
			// And they should select email
			expect(content).toContain('.select("email")')
		}
	})
})
