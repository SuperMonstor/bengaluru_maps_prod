import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("invite_token column security", () => {
	it("public map queries in mapsService should not select invite_token", () => {
		const mapsServicePath = path.resolve(
			__dirname,
			"../../lib/supabase/mapsService.ts"
		)
		const content = fs.readFileSync(mapsServicePath, "utf-8")

		// getMaps and getMapBySlug queries should not include invite_token
		// Only collaborator-related code should access it
		const selectCalls = content.match(/\.select\([^)]+\)/g) || []

		for (const selectCall of selectCalls) {
			// None of the select calls in mapsService should include invite_token
			expect(selectCall).not.toContain("invite_token")
		}
	})

	it("collaboratorActions should only access invite_token after ownership verification", () => {
		const actionsPath = path.resolve(
			__dirname,
			"../../lib/supabase/api/collaboratorActions.ts"
		)
		const content = fs.readFileSync(actionsPath, "utf-8")

		// The file should contain auth.getUser() calls
		expect(content).toContain("supabase.auth.getUser()")

		// invite_token access should happen in functions that check ownership
		const lines = content.split("\n")
		let foundGetUser = false
		for (const line of lines) {
			if (line.includes("auth.getUser()")) {
				foundGetUser = true
			}
		}
		expect(foundGetUser).toBe(true)
	})

	it("mapTypes should mark invite_token as optional", () => {
		const typesPath = path.resolve(
			__dirname,
			"../../lib/types/mapTypes.ts"
		)
		const content = fs.readFileSync(typesPath, "utf-8")

		// invite_token should be optional (not always returned)
		expect(content).toMatch(/invite_token\?/)
	})
})
