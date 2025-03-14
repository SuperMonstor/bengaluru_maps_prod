import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/api/supabaseServer"
import { slugify } from "@/lib/utils/slugify"

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Unwrap the params Promise
		const resolvedParams = await params
		const mapId = resolvedParams.id

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

		// Check if the user is the owner of the map
		const { data: mapData, error: mapError } = await supabase
			.from("maps")
			.select("owner_id")
			.eq("id", mapId)
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

		// Update the map
		const { data, error } = await supabase
			.from("maps")
			.update({
				name: title,
				short_description: shortDescription,
				body: mapBody,
				updated_at: new Date().toISOString(),
				slug: slugify(title),
			})
			.eq("id", mapId)
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
