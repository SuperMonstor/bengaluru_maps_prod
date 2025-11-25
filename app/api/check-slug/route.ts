import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/api/supabaseServer"

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const slug = searchParams.get("slug")

		if (!slug) {
			return NextResponse.json(
				{ error: "Slug parameter is required" },
				{ status: 400 }
			)
		}

		const supabase = await createClient()

		// Check if slug exists
		const { data, error } = await supabase
			.from("maps")
			.select("slug")
			.eq("slug", slug)
			.single()

		if (error) {
			// If error code is PGRST116, it means no rows found (slug is available)
			if (error.code === "PGRST116") {
				return NextResponse.json({ available: true })
			}
			// Other errors
			return NextResponse.json(
				{ error: "Error checking slug availability" },
				{ status: 500 }
			)
		}

		// If data exists, slug is taken
		return NextResponse.json({ available: false })
	} catch (error) {
		console.error("Error in check-slug route:", error)
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 }
		)
	}
}
