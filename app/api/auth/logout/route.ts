import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Logout error:", error)
    }

    const cookieStore = await cookies()

    // Clear all session cookies
    cookieStore.delete("sb-access-token")
    cookieStore.delete("sb-refresh-token")
    cookieStore.delete("user-id")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
