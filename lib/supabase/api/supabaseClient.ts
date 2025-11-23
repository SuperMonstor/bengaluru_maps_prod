import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

// Cache the browser client to prevent creating multiple instances
let browserClient: SupabaseClient | null = null

export function createClient() {
	if (browserClient) {
		return browserClient
	}

	browserClient = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	return browserClient
}