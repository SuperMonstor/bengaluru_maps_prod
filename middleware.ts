import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
	// Create a single response object that we'll mutate
	const response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	})

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value
				},
				set(name: string, value: string, options: CookieOptions) {
					// Update request cookies for downstream middleware/routes
					request.cookies.set({
						name,
						value,
						...options,
					})
					// Update the same response object (don't reassign)
					response.cookies.set({
						name,
						value,
						...options,
					})
				},
				remove(name: string, options: CookieOptions) {
					// Update request cookies for downstream middleware/routes
					request.cookies.set({
						name,
						value: "",
						...options,
					})
					// Update the same response object (don't reassign)
					response.cookies.set({
						name,
						value: "",
						...options,
					})
				},
			},
		}
	)

	// This will refresh session if expired - important to do before checking for user
	const {
		data: { user },
	} = await supabase.auth.getUser()

	// If no user and trying to access protected routes, redirect to login
	if (
		!user &&
		(request.nextUrl.pathname.startsWith("/dashboard") ||
			request.nextUrl.pathname.startsWith("/profile") ||
			request.nextUrl.pathname.startsWith("/create-map") ||
			request.nextUrl.pathname.startsWith("/my-maps")) // Add /my-maps protection
	) {
		const url = request.nextUrl.clone()
		url.pathname = "/login"
		return NextResponse.redirect(url)
	}

	// Return the response, potentially modified with updated cookies
	return response
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - api (API routes)
		 * - auth (authentication routes like login/callback)
		 * Feel free to modify this pattern to include more exceptions.
		 */
		"/((?!_next/static|_next/image|favicon.ico|api|auth|login|maps|assets|images|placeholder.svg|$).*)",
		"/dashboard/:path*",
		"/profile/:path*",
		"/create-map/:path*",
		"/my-maps/:path*",
	],
}
