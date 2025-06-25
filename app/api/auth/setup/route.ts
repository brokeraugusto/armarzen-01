import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const { setupKey } = await request.json()

    // Security key for initial setup
    if (setupKey !== "armarzen-setup-2024") {
      return NextResponse.json({ error: "Chave de setup inválida" }, { status: 401 })
    }

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@armarzen.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        name: "Admin ArMarZen",
        role: "admin",
      },
    })

    if (error) {
      console.error("Error creating admin user:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuário admin criado com sucesso",
      user: data.user,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
