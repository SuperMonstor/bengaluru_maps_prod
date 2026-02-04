import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { globSync } from "fs"

describe("no wildcard CORS headers", () => {
	it("no API route should set Access-Control-Allow-Origin: *", () => {
		const apiDir = path.resolve(__dirname, "../../app/api")

		function scanDir(dir: string): void {
			const entries = fs.readdirSync(dir, { withFileTypes: true })
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name)
				if (entry.isDirectory()) {
					scanDir(fullPath)
				} else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
					const content = fs.readFileSync(fullPath, "utf-8")
					expect(
						content,
						`${fullPath} should not contain wildcard CORS`
					).not.toMatch(/Access-Control-Allow-Origin.*\*/)
				}
			}
		}

		scanDir(apiDir)
	})
})
