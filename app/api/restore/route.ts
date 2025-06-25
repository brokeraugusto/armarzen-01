import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const backupData = await request.json()

    if (!backupData.timestamp || !backupData.version) {
      return NextResponse.json({ error: "Arquivo de backup inválido" }, { status: 400 })
    }

    const results: any = {
      categories: 0,
      products: 0,
      sales: 0,
      settings: 0,
      errors: [],
    }

    // Restaurar categorias
    if (backupData.categories) {
      try {
        const { error } = await supabase.from("categories").upsert(backupData.categories, { onConflict: "id" })
        if (error) throw error
        results.categories = backupData.categories.length
      } catch (error) {
        results.errors.push(`Categorias: ${error.message}`)
      }
    }

    // Restaurar produtos
    if (backupData.products) {
      try {
        const { error } = await supabase.from("products").upsert(backupData.products, { onConflict: "id" })
        if (error) throw error
        results.products = backupData.products.length
      } catch (error) {
        results.errors.push(`Produtos: ${error.message}`)
      }
    }

    // Restaurar configurações
    if (backupData.settings) {
      try {
        const { error } = await supabase.from("settings").upsert(backupData.settings, { onConflict: "key" })
        if (error) throw error
        results.settings = backupData.settings.length
      } catch (error) {
        results.errors.push(`Configurações: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Backup restaurado com sucesso",
      results,
    })
  } catch (error) {
    console.error("Restore error:", error)
    return NextResponse.json({ error: "Erro ao restaurar backup" }, { status: 500 })
  }
}
