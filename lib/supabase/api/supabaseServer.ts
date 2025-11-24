import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
	const cookieStore = await cookies()

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name) {
					const cookie = cookieStore.get(name)
					return cookie?.value
				},
				set(name, value, options) {
					try {
						cookieStore.set(name, value, options)
					} catch {
						// Silently ignore - this is expected when called from Server Components
						// Cookies can only be modified in Server Actions or Route Handlers
						// The middleware handles token refresh, so this is safe to ignore
					}
				},
				remove(name, options) {
					try {
						cookieStore.set(name, "", { ...options, maxAge: 0 })
					} catch {
						// Silently ignore - same reason as set()
					}
				},
			},
		}
	)
}
