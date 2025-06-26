import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value
    const userId = cookieStore.get("user-id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "",
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value
    const userId = cookieStore.get("user-id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { name, email } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verificar se o usuário existe
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !currentUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Atualizar perfil do usuário
    const { data, error } = await supabase.auth.admin.updateUserById(currentUser.id, {
      email: email.trim().toLowerCase(),
      user_metadata: {
        name: name.trim(),
      },
    })

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || "",
        created_at: data.user.created_at,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
