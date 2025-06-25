import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value
    const userId = cookieStore.get("user-id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ authenticated: false })
    }

    const supabase = createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      // Clear invalid cookies
      cookieStore.delete("sb-access-token")
      cookieStore.delete("sb-refresh-token")
      cookieStore.delete("user-id")

      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "Admin",
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false })
  }
}
