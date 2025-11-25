"use server"

import { createClient } from "@/lib/supabase/api/supabaseServer"
import { revalidatePath } from "next/cache"

export async function signOutAction() {
	const supabase = await createClient()
	await supabase.auth.signOut()
	// Revalidate the root path to refresh server-side user data
	revalidatePath("/", "layout")
}
