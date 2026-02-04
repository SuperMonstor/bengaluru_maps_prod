import { describe, it, expect, vi, beforeEach } from "vitest"

// We test the internal secret validation logic directly.
// The email routes should reject requests without a valid internal secret.

// Mock Resend with proper class constructor
vi.mock("resend", () => {
	class MockResend {
		emails = {
			send: vi.fn().mockResolvedValue({ data: { id: "test" }, error: null }),
		}
	}
	return { Resend: MockResend }
})

// Set internal secret before importing routes
process.env.INTERNAL_API_SECRET = "test-secret-123"
process.env.RESEND_API_KEY = "re_test_key"

// Helper to create a NextRequest-like object
function createRequest(
	body: Record<string, unknown>,
	headers: Record<string, string> = {}
): Request {
	return new Request("http://localhost:3000/api/email", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: JSON.stringify(body),
	})
}

describe("email route security", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("rejects requests without internal secret", async () => {
		const { POST } = await import("@/app/api/email/route")

		const request = createRequest({
			ownerEmail: "test@example.com",
			mapTitle: "Test Map",
			locationName: "Test Location",
			submitterName: "Test User",
			mapUrl: "https://example.com/maps/test",
		})

		const response = await POST(request as never)
		const json = await response.json()

		expect(response.status).toBe(403)
		expect(json.success).toBe(false)
		expect(json.error).toMatch(/unauthorized|forbidden/i)
	})

	it("rejects requests with wrong internal secret", async () => {
		const { POST } = await import("@/app/api/email/route")

		const request = createRequest(
			{
				ownerEmail: "test@example.com",
				mapTitle: "Test Map",
				locationName: "Test Location",
				submitterName: "Test User",
				mapUrl: "https://example.com/maps/test",
			},
			{ "x-internal-secret": "wrong-secret" }
		)

		const response = await POST(request as never)
		const json = await response.json()

		expect(response.status).toBe(403)
		expect(json.success).toBe(false)
	})

	it("accepts requests with correct internal secret", async () => {
		const { POST } = await import("@/app/api/email/route")

		const request = createRequest(
			{
				ownerEmail: "test@example.com",
				mapTitle: "Test Map",
				locationName: "Test Location",
				submitterName: "Test User",
				mapUrl: "https://example.com/maps/test",
			},
			{ "x-internal-secret": "test-secret-123" }
		)

		const response = await POST(request as never)
		const json = await response.json()

		expect(response.status).toBe(200)
		expect(json.success).toBe(true)
	})
})

describe("email approve route security", () => {
	it("rejects requests without internal secret", async () => {
		const { POST } = await import("@/app/api/email/approve/route")

		const request = createRequest({
			submitterEmail: "test@example.com",
			mapTitle: "Test Map",
			locationName: "Test Cafe",
			mapUrl: "https://example.com/maps/test",
		})

		const response = await POST(request as never)
		expect(response.status).toBe(403)
	})

	it("accepts requests with correct internal secret", async () => {
		const { POST } = await import("@/app/api/email/approve/route")

		const request = createRequest(
			{
				submitterEmail: "test@example.com",
				mapTitle: "Test Map",
				locationName: "Test Cafe",
				mapUrl: "https://example.com/maps/test",
			},
			{ "x-internal-secret": "test-secret-123" }
		)

		const response = await POST(request as never)
		const json = await response.json()
		expect(json.success).toBe(true)
	})
})

describe("email reject route security", () => {
	it("rejects requests without internal secret", async () => {
		const { POST } = await import("@/app/api/email/reject/route")

		const request = createRequest({
			submitterEmail: "test@example.com",
			mapTitle: "Test Map",
			locationName: "Test Cafe",
		})

		const response = await POST(request as never)
		expect(response.status).toBe(403)
	})

	it("accepts requests with correct internal secret", async () => {
		const { POST } = await import("@/app/api/email/reject/route")

		const request = createRequest(
			{
				submitterEmail: "test@example.com",
				mapTitle: "Test Map",
				locationName: "Test Cafe",
			},
			{ "x-internal-secret": "test-secret-123" }
		)

		const response = await POST(request as never)
		const json = await response.json()
		expect(json.success).toBe(true)
	})
})

describe("email collaborator-joined route security", () => {
	it("rejects requests without internal secret", async () => {
		const { POST } = await import("@/app/api/email/collaborator-joined/route")

		const request = createRequest({
			ownerEmail: "test@example.com",
			mapTitle: "Test Map",
			collaboratorName: "New User",
			mapUrl: "https://example.com/maps/test",
		})

		const response = await POST(request as never)
		expect(response.status).toBe(403)
	})

	it("accepts requests with correct internal secret", async () => {
		const { POST } = await import("@/app/api/email/collaborator-joined/route")

		const request = createRequest(
			{
				ownerEmail: "test@example.com",
				mapTitle: "Test Map",
				collaboratorName: "New User",
				mapUrl: "https://example.com/maps/test",
			},
			{ "x-internal-secret": "test-secret-123" }
		)

		const response = await POST(request as never)
		const json = await response.json()
		expect(json.success).toBe(true)
	})
})
