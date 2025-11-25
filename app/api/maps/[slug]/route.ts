import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify"

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		// Unwrap the params Promise
		const resolvedParams = await params
		const mapSlug = resolvedParams.slug

		const supabase = await createClient()

		// Get the current user
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Get request body
		const body = await request.json()
		const { title, shortDescription, body: mapBody } = body

		if (!title || !shortDescription || !mapBody) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			)
		}

		// Check if the user is the owner of the map by slug
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("id, owner_id, slug")
			.eq("slug", mapSlug)
			.single()

		if (mapError) {
			return NextResponse.json(
				{ error: `Error checking map ownership: ${mapError.message}` },
				{ status: 404 }
			)
		}

		// Only allow update if user is the map owner
		if (mapData.owner_id !== user.id) {
			return NextResponse.json(
				{ error: "You don't have permission to edit this map" },
				{ status: 403 }
			)
		}

		// Generate new slug if title changed
		let newSlug = mapData.slug
		if (title !== mapData.slug) {
			// Get all existing slugs except current map
			const { data: existingMaps } = await supabase
				.from("maps")
				.select("slug")
				.neq("id", mapData.id)
			const existingSlugs = existingMaps?.map((m) => m.slug) || []
			newSlug = generateUniqueSlug(title, existingSlugs)
		}

		// Update the map
		const { data, error } = await supabase
			.from("maps")
			.update({
				name: title,
				short_description: shortDescription,
				body: mapBody,
				updated_at: new Date().toISOString(),
				slug: newSlug,
			})
			.eq("id", mapData.id)
			.select()
			.single()

		if (error) {
			return NextResponse.json(
				{ error: `Failed to update map: ${error.message}` },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			data: {
				id: data.id,
				title: data.name,
				slug: slugify(data.name),
			},
		})
	} catch (error) {
		console.error("Error in map update route:", error)
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 }
		)
	}
}
