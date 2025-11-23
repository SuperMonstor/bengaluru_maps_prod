"use server"

import { createClient } from "@/lib/supabase/api/supabaseServer"

export async function signOutAction() {
	const supabase = await createClient()
	await supabase.auth.signOut()
	// Don't redirect here - let the client handle the full page reload
}
