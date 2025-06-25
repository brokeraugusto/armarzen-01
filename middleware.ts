import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check authentication cookies
  const accessToken = req.cookies.get("sb-access-token")?.value
  const userId = req.cookies.get("user-id")?.value

  const isAuthenticated = !!(accessToken && userId)
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/setup")

  // Protect admin routes
  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect authenticated users from auth pages
  if (isAuthRoute && isAuthenticated && !req.nextUrl.pathname.startsWith("/setup")) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register", "/setup"],
}
