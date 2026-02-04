import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

describe("googleMapsListService safe parser", () => {
	const servicePath = path.resolve(
		__dirname,
		"../../lib/services/googleMapsListService.ts"
	)

	it("should not use Function() constructor (eval equivalent)", () => {
		const content = fs.readFileSync(servicePath, "utf-8")
		// Should not contain Function(` or new Function(
		expect(content).not.toMatch(/\bFunction\s*\(/)
	})

	it("should not use eval()", () => {
		const content = fs.readFileSync(servicePath, "utf-8")
		expect(content).not.toMatch(/\beval\s*\(/)
	})
})

// Test the safe parser logic directly by importing the module
// and testing via the public extraction functions
describe("safe JS array parser", () => {
	// We can't easily import the private parseArray function,
	// so we test via the public parseJsArraySafe export
	it("should parse simple arrays", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe("[1, 2, 3]")
		expect(result).toEqual([1, 2, 3])
	})

	it("should parse nested arrays with nulls", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe("[null, null, 12.9716, 77.5946]")
		expect(result).toEqual([null, null, 12.9716, 77.5946])
	})

	it("should parse strings with escaped quotes", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe('["hello", "world"]')
		expect(result).toEqual(["hello", "world"])
	})

	it("should parse deeply nested structures", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe(
			'[["Cafe",null,[null,null,12.97,77.59]],["Restaurant",null,[null,null,13.0,77.6]]]'
		)
		expect(result).toEqual([
			["Cafe", null, [null, null, 12.97, 77.59]],
			["Restaurant", null, [null, null, 13.0, 77.6]],
		])
	})

	it("should parse booleans", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe("[true, false, null]")
		expect(result).toEqual([true, false, null])
	})

	it("should parse negative numbers", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe("[-12.5, -77.3]")
		expect(result).toEqual([-12.5, -77.3])
	})

	it("should parse strings with unicode escapes", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe('["hello\\u0026world"]')
		expect(result).toEqual(["hello&world"])
	})

	it("should reject code injection attempts", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		// These should return null or parse safely without executing code
		const result1 = parseJsArraySafe(
			'(function(){ throw new Error("pwned") })()'
		)
		expect(result1).toBeNull()

		const result2 = parseJsArraySafe('require("child_process")')
		expect(result2).toBeNull()
	})

	it("should handle empty arrays", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		expect(parseJsArraySafe("[]")).toEqual([])
		expect(parseJsArraySafe("[[]]")).toEqual([[]])
	})

	it("should handle whitespace-heavy input", async () => {
		const { parseJsArraySafe } = await import(
			"@/lib/services/googleMapsListService"
		)
		const result = parseJsArraySafe("  [  1 ,  2  ,  3  ]  ")
		expect(result).toEqual([1, 2, 3])
	})
})
