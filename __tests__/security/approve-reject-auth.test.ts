import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the supabaseServer module
const mockSupabase = {
	auth: {
		getUser: vi.fn(),
	},
	from: vi.fn(),
}

vi.mock("@/lib/supabase/api/supabaseServer", () => ({
	createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Mock permissionHelpers
vi.mock("@/lib/supabase/api/permissionHelpers", () => ({
	hasMapEditPermission: vi.fn(),
}))

// Mock fetch for email sending
global.fetch = vi.fn(() =>
	Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
)

import { approveLocationAction } from "@/lib/supabase/api/approveLocationAction"
import { rejectLocationAction } from "@/lib/supabase/api/rejectLocationAction"
import { hasMapEditPermission } from "@/lib/supabase/api/permissionHelpers"

const mockHasMapEditPermission = vi.mocked(hasMapEditPermission)

describe("approveLocationAction", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("rejects unauthenticated users", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const result = await approveLocationAction("location-123")

		expect(result.success).toBe(false)
		expect(result.error).toMatch(/logged in|authenticated/i)
	})

	it("rejects users without map edit permission", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: { id: "user-456" } },
			error: null,
		})

		// Mock fetching the location to get map_id
		const selectMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: {
						id: "location-123",
						map_id: "map-789",
						creator_id: "other-user",
					},
					error: null,
				}),
			}),
		})
		mockSupabase.from.mockReturnValue({ select: selectMock })

		mockHasMapEditPermission.mockResolvedValue(false)

		const result = await approveLocationAction("location-123")

		expect(result.success).toBe(false)
		expect(result.error).toMatch(/permission/i)
	})

	it("allows map owners to approve locations", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: { id: "owner-123" } },
			error: null,
		})

		// First call: fetch location to check permission
		const locationSelectMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: {
						id: "location-123",
						map_id: "map-789",
						creator_id: "submitter-456",
					},
					error: null,
				}),
			}),
		})

		// Second call: update the location
		const updateMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: {
							id: "location-123",
							name: "Test Cafe",
							creator_id: "submitter-456",
							maps: { name: "My Map", slug: "my-map", id: "map-789" },
						},
						error: null,
					}),
				}),
			}),
		})

		// Third call: fetch submitter email
		const userSelectMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: { email: "submitter@test.com" },
					error: null,
				}),
			}),
		})

		let callCount = 0
		mockSupabase.from.mockImplementation((table: string) => {
			callCount++
			if (table === "locations" && callCount === 1) {
				return { select: locationSelectMock }
			}
			if (table === "locations" && callCount === 2) {
				return { update: updateMock }
			}
			if (table === "users") {
				return { select: userSelectMock }
			}
			return { select: vi.fn(), update: vi.fn() }
		})

		mockHasMapEditPermission.mockResolvedValue(true)

		const result = await approveLocationAction("location-123")

		expect(result.success).toBe(true)
		expect(mockHasMapEditPermission).toHaveBeenCalledWith(
			mockSupabase,
			"map-789",
			"owner-123"
		)
	})
})

describe("rejectLocationAction", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("rejects unauthenticated users", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const result = await rejectLocationAction("location-123")

		expect(result.success).toBe(false)
		expect(result.error).toMatch(/logged in|authenticated/i)
	})

	it("rejects users without map edit permission", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: { id: "user-456" } },
			error: null,
		})

		const selectMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: {
						id: "location-123",
						map_id: "map-789",
						creator_id: "other-user",
					},
					error: null,
				}),
			}),
		})
		mockSupabase.from.mockReturnValue({ select: selectMock })

		mockHasMapEditPermission.mockResolvedValue(false)

		const result = await rejectLocationAction("location-123")

		expect(result.success).toBe(false)
		expect(result.error).toMatch(/permission/i)
	})

	it("allows map owners to reject locations", async () => {
		mockSupabase.auth.getUser.mockResolvedValue({
			data: { user: { id: "owner-123" } },
			error: null,
		})

		const locationSelectMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: {
						id: "location-123",
						map_id: "map-789",
						creator_id: "submitter-456",
					},
					error: null,
				}),
			}),
		})

		const updateMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: {
							id: "location-123",
							name: "Test Cafe",
							creator_id: "submitter-456",
							maps: { name: "My Map", slug: "my-map", id: "map-789" },
						},
						error: null,
					}),
				}),
			}),
		})

		const userSelectMock = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: { email: "submitter@test.com" },
					error: null,
				}),
			}),
		})

		let callCount = 0
		mockSupabase.from.mockImplementation((table: string) => {
			callCount++
			if (table === "locations" && callCount === 1) {
				return { select: locationSelectMock }
			}
			if (table === "locations" && callCount === 2) {
				return { update: updateMock }
			}
			if (table === "users") {
				return { select: userSelectMock }
			}
			return { select: vi.fn(), update: vi.fn() }
		})

		mockHasMapEditPermission.mockResolvedValue(true)

		const result = await rejectLocationAction("location-123")

		expect(result.success).toBe(true)
		expect(mockHasMapEditPermission).toHaveBeenCalledWith(
			mockSupabase,
			"map-789",
			"owner-123"
		)
	})
})
