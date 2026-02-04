import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("diagnostics endpoint removal", () => {
	it("diagnostics route file should not exist", () => {
		const diagnosticsPath = path.resolve(
			__dirname,
			"../../app/api/email/diagnostics/route.ts"
		)
		expect(fs.existsSync(diagnosticsPath)).toBe(false)
	})

	it("diagnostics directory should not exist", () => {
		const diagnosticsDir = path.resolve(
			__dirname,
			"../../app/api/email/diagnostics"
		)
		expect(fs.existsSync(diagnosticsDir)).toBe(false)
	})
})
