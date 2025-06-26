import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("sb-access-token")?.value
    const userId = cookieStore.get("user-id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
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

    // Verificar senha atual tentando fazer login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email!,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    // Atualizar senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(currentUser.id, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
