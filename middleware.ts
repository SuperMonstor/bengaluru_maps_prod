import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
	const isAuthenticated = req.cookies.has("sb-access-token") // Supabase stores session in cookies

	if (!isAuthenticated && req.nextUrl.pathname !== "/login") {
		return NextResponse.redirect(new URL("/login", req.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/dashboard/:path*", "/profile/:path*"], // Protect these routes
}
